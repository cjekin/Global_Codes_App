
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


   

