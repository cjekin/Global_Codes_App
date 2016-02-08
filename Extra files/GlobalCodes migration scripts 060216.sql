
-- Scripts to move from Warehouse to GlobalCodes database

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


-- Notes:
Move Add GlobalCodes_FLAT to spGetNewTFC procedure
Rename spGetNewTFC to spCreateStagingTables and move to GlobalCodes table
create a GlobalCodes_FORM_INFO table





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

select Origin, TLC, TFC
into [GlobalCodes].dbo.GlobalCodes_FLAT
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





-- Move the mapping table to loinc based
create table [GlobalCodes].dbo.GlobalCodes_Map (
	map_id int IDENTITY(1,1) PRIMARY KEY
	,[origin] varchar(20)
    ,[tfc] varchar(5)
    ,[loinc] varchar(20)
    ,[container] varchar(50)
    ,[loc1] varchar(20)
    ,[loc2] varchar(20)
    ,[result_type] varchar(20)
	,[excluded] varchar(50)
)

insert into [GlobalCodes].dbo.GlobalCodes_Map ([origin],[tfc],[loinc],[container],[loc1],[loc2],[result_type],[excluded])
select Origin as origin, 
Code as tfc,
isnull(g.LOINC,'') as loinc, 
isnull(g.[Sample],'') as container, 
isnull(g.SubSectionCode,'') as loc1,
isnull(g.HALO_SubSectionCode,'') as loc2, 
isnull(g.Type,'') as result_type,
isnull(Excluded,'') as excluded
from [Warehouse].dbo.GlobalCodes_Map m
left join [Warehouse].dbo.GlobalCodes_Main g on m.GlobalCode = g.GlobalCode


   

