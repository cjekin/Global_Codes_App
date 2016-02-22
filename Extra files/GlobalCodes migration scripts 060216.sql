
-- Scripts to move from Warehouse to GlobalCodes database
-- Notes:
--Move Add GlobalCodes_FLAT to spGetNewTFC procedure
--Rename spGetNewTFC to spCreateStagingTables and move to GlobalCodes table
--create a GlobalCodes_FORM_INFO table
--Move the exclusion to result type


-- Move existing tables
select *
into [GlobalCodes].dbo.GlobalCodes_FORM_STAGING
from [Warehouse].dbo.GlobalCodes_FORM_STAGING

select *
into [GlobalCodes].dbo.GlobalCodes_TEST_CODES_STAGING
from [Warehouse].dbo.GlobalCodes_TEST_CODES_STAGING

select *
into [GlobalCodes].dbo.GlobalCodes_TEST_STAGING
from [Warehouse].dbo.GlobalCodes_TEST_STAGING

select *
into [GlobalCodes].dbo.GlobalCodes_SECTIONS
from [Warehouse].dbo.GlobalCodes_SECTIONS







-- Create Map table
create table [GlobalCodes].dbo.GlobalCodes_Map (
	map_id int IDENTITY(1,1) PRIMARY KEY,
	origin varchar(20),
	tfc varchar(5),
	loinc varchar(20),
	container varchar(50),
	loc1 varchar(20),
	loc2 varchar(20),
	result_type varchar(20),
	excluded varchar(50)
)

insert into [GlobalCodes].dbo.GlobalCodes_Map (origin,tfc,loinc,container,loc1,loc2,result_type,excluded)
select Origin, Code, isnull(LOINC,'') as loinc, isnull(Sample,'') as container, 
isnull(SubSectionCode,'') as loc1, isnull(HALO_SubSectionCode,'') as loc2, isnull(Type,'') as result_type, 
isnull(Excluded,'') as excluded
from [Warehouse].dbo.GlobalCodes_Map map
left join [Warehouse].dbo.GlobalCodes_Main g on map.GlobalCode = g.GlobalCode



-- Create FLAT table (TLC to TFC map)
create table [GlobalCodes].dbo.GlobalCodes_FLAT (
	origin varchar(20), TLC varchar(10), TFC varchar(10)
)




-- Build the global locations table
create table [GlobalCodes].dbo.[GlobalCodes_Locations] (
	[SubSectionCode] varchar(50)
      ,[SubSection] varchar(100)
      ,[Department] varchar(50)
      ,[Location] varchar(100)
      ,[Address] varchar(max)
      ,[PostCode] varchar(50)
      ,[Telephone] varchar(255)
      ,[Contact] varchar(255)
	  ,[URL] varchar(255)
	  ,[Notes] varchar(max)
      ,[HALO] varchar(1)
      ,[WSL] varchar(1)
      ,[Referral] varchar(1)
)

insert into [GlobalCodes].dbo.[GlobalCodes_Locations] (
	[SubSectionCode]
      ,[SubSection]
      ,[Department]
      ,[Location]
      ,[Address]
      ,[PostCode]
      ,[Telephone]
      ,[Contact]
      ,[HALO]
      ,[WSL]
      ,[Referral]
)
select * from [Warehouse].[dbo].[GlobalCodes_Departments]




-- Create flattened map of TLC to TFC
use GlobalCodes

delete from [GlobalCodes].dbo.GlobalCodes_FLAT

insert into [GlobalCodes].dbo.GlobalCodes_FLAT(origin,TLC,TFC)
select Origin, TLC, TFC
from (
	select tlc.Origin, [Test Code] as TLC, TFC, ID
	from GlobalCodes_TEST_STAGING tlc
	inner join GlobalCodes_TEST_CODES_STAGING tc on tlc.[Test Code] = tc.TLC and tlc.Origin = tc.Origin
	inner join GlobalCodes_FORM_STAGING f on tc.Code = f.TFC and tc.Origin = f.Origin
	where tlc.[TLC type] in ('G','I')
	union
	select tlc.Origin, [Test Code] as TLC, TFC, ID
	from GlobalCodes_TEST_STAGING tlc
	inner join GlobalCodes_TEST_CODES_STAGING tc1 on tlc.[Test Code] = tc1.TLC and tlc.Origin = tc1.Origin
	inner join GlobalCodes_TEST_CODES_STAGING tc2 on tc1.[Code] = tc2.TLC and tc1.Origin = tc2.Origin
	inner join GlobalCodes_FORM_STAGING f on tc2.Code = f.TFC and tc2.Origin = f.Origin
	where tlc.[TLC type] in ('P')
) q
order by Origin, TLC, ID







-- Create a container table
create table [GlobalCodes].dbo.[GlobalCodes_Container] (
	cont_id int IDENTITY(1,1) PRIMARY KEY,
	container varchar(50),
	cont_type varchar(50)
);

insert into [GlobalCodes].dbo.[GlobalCodes_Container] (container, cont_type) 
select distinct container, '' as cont_type
from [GlobalCodes].dbo.GlobalCodes_Map
where container <> ''
order by container


-- Create the FORM_INFO table
create table [GlobalCodes].dbo.[GlobalCodes_FORM_INFO] (
	Origin varchar(11),
	TFC varchar(10),
	Active varchar(5),
	NumLastYear int,
	MostCommon varchar(70),
	MostCommonPct int,
	SecondMostCommon varchar(70),
	SecondMostCommonPct int,
	Average float,
	SD float,
	Low float,
	High float,
	TLC varchar(10),
	TLCDescription varchar(10),
	SectionName varchar(50),
	RefLabName varchar(70)
)





-- Create lexical table
create table GlobalCodes.dbo.GlobalCodes_Lexical (

	-- Primary keys
	 id int identity(1,1) primary key
	,loinc varchar(20)
	,container varchar(50)

	-- LOINC to SNOMED translation
	,SCTint_Component varchar(20)
    ,SCTint_Sample varchar(20)
    ,SCTint_Method varchar(20)
    ,SCTint_Precondition varchar(20)
    ,SCTint_Units varchar(20)

	,SCTint_Component_Desc varchar(255)
	,SCTint_Sample_Desc varchar(255)
	,SCTint_Method_Desc varchar(255)
	,SCTint_Precondition_desc varchar(255)
	,SCTint_Units_desc varchar(255)

	-- NLMC
	,NLMC varchar(10)
	,NLMC_REP varchar(20)
	,NLMC_Desc varchar(255)
	,NLMC_REP_Desc varchar(255)
	,SCTUK_Component varchar(20)

	-- Read
	,Readv2 varchar(10)
	,Readv2_Desc varchar(100)

	-- Internal descriptions
	,BC_Analyte varchar(255)
	,BC_PrimaryLib varchar(255)
	,BC_Desc varchar(255)

	-- Finance
	,HSL varchar(10)
	,HSL_Desc varchar(255)
	,HSL_Dept varchar(50)
	,Dynamics varchar(50)

)

-- Create the initial table
insert into GlobalCodes.dbo.GlobalCodes_Lexical(loinc,container)
select distinct loinc, container
from GlobalCodes_Map m
where loinc <> ''
order by loinc, container


-- Creation of the Lexical to SNOMED CT map
select 
       [correlationId]
      ,[LOINC]
	  ,case when isnull([Towards],'') = '' and isnull([Process output],'') = '' then [Property type]
			when isnull([Towards],'') = '' and isnull([Process output],'') <> '' then [Process output]
			else isnull([Towards],'') end as SCTint_Component
      ,[Direct site] as SCTint_Sample
      ,[Technique] as SCTint_Method
      ,[Precondition] as SCTint_Precondition
      ,[Units] as SCTint_Units
      
	  ,[LOINC_desc]
	  ,case when isnull([Towards_desc],'') = '' and isnull([Process output_desc],'') = '' then [Property type_desc]
			when isnull([Towards_desc],'') = '' and isnull([Process output_desc],'') <> '' then [Process output_desc]
			else isnull([Towards_desc],'') end as SCTint_Component_Desc
	  ,[Direct site_desc] as SCTint_Sample_Desc
	  ,[Technique_desc] as SCTint_Method_Desc
	  ,[Precondition_desc] as SCTint_Precondition_desc
	  ,[Units_desc] as SCTint_Units_desc

into #loinc_sct_map
FROM [GlobalCodes].[dbo].[LOINC_SNOMEDCT_Map]


-- Update LOINC with LOINC_SNOMEDCTInt map
update l 
set  l.SCTint_Component = m.SCTint_Component
	,l.SCTint_Sample = m.SCTint_Sample
	,l.SCTint_Method = m.SCTint_Method
	,l.SCTint_Precondition = m.SCTint_Precondition
	,l.SCTint_Units = m.SCTint_Units
	,l.SCTint_Component_Desc = m.SCTint_Component_Desc
	,l.SCTint_Sample_Desc = m.SCTint_Sample_Desc 
	,l.SCTint_Method_Desc = m.SCTint_Method_Desc
	,l.SCTint_Precondition_desc = m.SCTint_Precondition_desc
	,l.SCTint_Units_desc = m.SCTint_Units_desc
from 
	GlobalCodes.dbo.GlobalCodes_Lexical l
	inner join #loinc_sct_map m on l.loinc = m.loinc



-- Update LOINC with HSL Codes
update l 
set  l.HSL = h.HSL_Code
	,l.HSL_Desc = h.HSL_Desc
	,l.HSL_Dept = h.HSL_Dept
from 
	GlobalCodes.dbo.GlobalCodes_Lexical l
	inner join (
		select distinct map.loinc, map.container, max(h.HSL_Code) as HSL_Code, max(h.HSL_Description) as HSL_Desc, max(h.HSL_Department) as HSL_Dept
		from [Warehouse].[dbo].[GlobalCodes_HSLCodes] h 
		inner join GlobalCodes.dbo.GlobalCodes_Map map on map.origin = h.[Database] and map.tfc = h.tfc
		where map.loinc <> ''
		and h.HSL_Code <> ''
		group by map.loinc, map.container
	) h on l.loinc = h.loinc and l.container = h.container


-- Update Lexical with Warehouse mappings
update l 
set  l.NLMC = left(g.NLMC,10)
	,l.Readv2 = left(g.Readv2,10)
	,l.SCTUK_Component = left(g.SCTUK_Component,20)
	,l.BC_Analyte = g.Analyte
	,l.BC_PrimaryLib = g.PrimaryLibrary
	,l.BC_Desc = g.Description
from 
	GlobalCodes.dbo.GlobalCodes_Lexical l
	inner join (
		select distinct g.loinc, g.[sample] as container
		,max(g.NLMC) as NLMC, max(g.PBCL) as Readv2, max(SNOMEDCT_UK) as SCTUK_Component
		,max(g.Analyte) as Analyte, max(g.PrimaryLibrary) as PrimaryLibrary
		,max(g.Description) as Description
		from [Warehouse].[dbo].[GlobalCodes_Main] g
		where isnull(g.loinc,'') <> ''
		group by g.loinc, g.[Sample]
	) g on l.loinc = g.loinc and l.container = g.container



-- Update Lexical with Readv2 (PBCL)
update l 
set  l.Readv2_Desc = r.V2_TERM
from 
	GlobalCodes.dbo.GlobalCodes_Lexical l
	inner join GlobalCodes.dbo.Readv2_PBCL r on l.Readv2 = r.V2_READ_CODE



select * from GlobalCodes.dbo.GlobalCodes_Lexical

select * from Readv2_PBCL



-------------------
-- Preanalytics
-------------------

create table GlobalCodes.dbo.GlobalCodes_Preanalytics (
	
	-- Linking
	id int identity(1,1) primary key,
	loinc varchar(20),
	container varchar(50),
	loc varchar(20),

	-- Preanalytics info
	automated varchar(1),
	aliquot varchar(1),
	deadvol int,
	vol int,
	frozen varchar(1),

	-- Manual info
	handling varchar(max),
	courier varchar(max),
	tat int,
	tat_workingdays int

)

delete from GlobalCodes.dbo.GlobalCodes_Preanalytics

insert into GlobalCodes.dbo.GlobalCodes_Preanalytics (loinc, container, loc)
select distinct loinc, container, loc1
from GlobalCodes.dbo.GlobalCodes_Map
where loinc <> '' and result_type in ('Result','SubResult')
and loinc + container + loc1 not in (select loinc + container + loc1 from GlobalCodes.dbo.GlobalCodes_Preanalytics)
