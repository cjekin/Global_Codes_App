

select distinct map.origin, f.WrkSection as sec, s.section_name,
sum(case when result_type not in ('Result', 'SubResult', 'Held') then 1 else 0 end) as num_codes, 
sum(case when loinc <> '' then 1 else 0 end) as num_mapped
from GlobalCodes.dbo.GlobalCodes_Map map
inner join GlobalCodes.dbo.GlobalCodes_FORM_STAGING f on map.origin = f.Origin and map.tfc = f.TFC
inner join GlobalCodes.dbo.GlobalCodes_SECTIONS s on f.WrkSection = s.section_letter and f.Origin = s.Origin
group by map.origin, f.WrkSection, s.section_name
order by map.origin, f.WrkSection, s.section_name
