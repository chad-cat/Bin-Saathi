import { Category } from './types';

export const MODEL_SCAN = 'gemini-3.1-flash-lite';
export const MODEL_SMART = 'gemini-3.8-flash';
export const FALLBACK_MODEL = 'gemini-2.5-flash';
export const MODEL_FALLBACK_CHAIN = [MODEL_SCAN, MODEL_SMART, FALLBACK_MODEL];
export const IMAGE_MAX_PX = 768;
export const CONF_HIGH = 0.80;
export const CONF_MED = 0.55;

export const CATEGORY_COLORS: Record<Category, string> = {
  wet: '#5E8C61',
  dry: '#5B7C99',
  sanitary: '#A8605F',
  special_care: '#B58B3A',
  e_waste: '#6E6A8F',
  battery: '#8C7B5A',
  horticulture: '#7D8C61',
  c_and_d: '#8C877D',
  biomedical: '#A05A5A',
  hazardous: '#B35338',
  reuse_donate: '#4A7C59',
  unknown: '#7A7A75',
};

export const SWM_DIGEST = `Scope (Rule 2). Applies to every local body, institution, government and private organisation, and every domestic, institutional, commercial and other non-residential waste generator. The Rules do not cover industrial waste, hazardous waste, hazardous chemicals, bio-medical waste, e-waste, battery waste or radio-active waste, which have separate rules.
Four streams at source (Rule 5(1)(b)). Every waste generator stores waste in four separate streams: wet, dry, sanitary, special care, and hands it to authorised waste pickers or collectors as the local authority directs.
Wet waste (Rule 3(1)(zzl)). Organic waste including kitchen, food, vegetable, meat, fruit and flower waste and similar biodegradable waste.
Dry waste (Rule 3(1)(s)). Waste other than wet, sanitary and special care waste; includes recyclable and non-recyclable waste. "Segregation" (Rule 3(1)(zt)) separates wet waste (including agriculture and dairy waste), dry waste (recyclable, and non-recyclable combustible), sanitary waste with non-recyclable inert waste, special care waste, and construction and demolition waste.
Sanitary waste (Rule 3(1)(zp)). Used diapers, sanitary towels or napkins, tampons, condoms, incontinence sheets and similar waste. Rule 5(1)(c): wrap it securely (in the manufacturer's pouch or suitable wrapping) and place it in the sanitary waste bin, separate from dry, wet and special care bins.
Special care waste (Rule 3(1)(zx)), household level. Discarded paint drums; pesticide cans, containers or bottles; CFL bulbs; tube lights; expired medicines; broken mercury thermometers; waste batteries; used or waste needles and syringes; contaminated gauze; and anything else the Central Pollution Control Board notifies.
Horticultural waste (Rule 3(1)(y), 5(1)(e)). Garden and park waste (grass and wood clippings, weeds, pruning, branches, twigs, dead leaves, tree trimmings) is stored separately on the premises and disposed as the local body directs.
Construction and demolition waste (Rule 5(1)(d)). Stored separately and handled under the Environment (Construction and Demolition) Waste Management Rules, 2025.
Prohibitions (Rule 5(1)(f)). Do not throw, burn or bury solid waste on streets, open public spaces or in drains and water bodies.
Events (Rule 5(1)(j)). Gatherings of more than 100 people at unlicensed places need three working days' notice to the local body, with segregation and handover arranged.
Bio-medical waste (Rule 5(1)(k)). Occupiers covered by the Bio-Medical Waste Management Rules 2016 must not mix bio-medical waste with solid waste.
Institutions and large generators (Rule 5(2), 3(1)(i), 6). Gated communities and institutions above 5,000 sq. m., resident welfare associations, market associations, hotels and restaurants must ensure segregation at source and, as far as possible, compost or bio-methanate biodegradable waste on their premises. A bulk waste generator is an entity (including educational institutions, universities and hostels) that meets any one of: floor area 20,000 sq. m. or more, water use 40,000 litres a day, or 100 kg of waste a day. Bulk generators register on the central online portal and must arrange processing of their wet waste.
Collection (Rule 8). Collection vehicles must have separate compartments for wet and dry waste and arrangements for sanitary, special care and horticultural waste; streams must not be mixed during transport.
Material recovery facilities (Rule 9(7)). Registered MRFs may act as drop-off or deposition centres for e-waste, special care waste, sanitary waste and other separately regulated waste, and as uptake points for plastic and e-waste processors.
Bins (Rule 39(51)). Public-place bins for wet waste are painted green and for dry waste blue; red bins may be placed in public toilets for sanitary waste.
Fines and awareness (Rule 39(31), 39(32)). Urban local bodies set spot fines for violations under their bye-laws and run awareness on not littering, minimising and reusing waste, segregating into wet, dry (recyclable, non-recyclable), sanitary and special care waste, home composting, wrapping sanitary waste, and handing segregated waste to pickers, collectors or recyclers.
Waste hierarchy (Rule 3(1)(zzi)). Prevention, reduction, reuse, recycling, recovery, disposal (landfill is the last option).
Non-recyclable combustible waste (Rule 3(1)(l), 13). Non-biodegradable, non-recyclable, non-hazardous waste with calorific value above 1,500 kcal/kg, excluding chlorinated materials, may go to refuse-derived fuel, waste-to-energy or co-processing.
Landfill (Rule 14(4)). Only non-usable, non-recyclable, non-reactive inert waste and residues go to sanitary landfill. No wet waste.
A note on the source text. The Rules' landfill schedule still refers to the E-waste (Management) Rules 2016; the current rules are the E-Waste (Management) Rules 2022.`;

export const EXTENDED_DIGEST = `E-waste. E-Waste (Management) Rules 2022 (effective 1 April 2023). Schedule I covers 106 types of electrical and electronic equipment: IT and telecom equipment (computers, laptops, tablets, printers and cartridges, phones), consumer electricals and electronics (TVs, refrigerators, washing machines, air conditioners, lamps including fluorescent and other mercury-containing lamps), large and small appliances, electrical tools, toys and leisure equipment, medical devices and laboratory instruments. Producers carry Extended Producer Responsibility. Consumers should use authorised collection points, producer or dealer take-back, or registered recyclers, and never the dry bin.
Batteries. Battery Waste Management Rules 2022 (notified August 2022, replacing the 2001 rules). Covers lead-acid, lithium-ion and other portable, automotive, industrial and EV batteries, with producer take-back (EPR). Used batteries must not go into household waste; hand them to registered collection centres, dealers or recyclers. Lithium-ion cells and power banks are a fire risk if crushed or dumped.
Plastic packaging. Plastic Waste Management Rules 2016 as amended (EPR framework from 2022). EPR categories: I rigid packaging, II flexible packaging (single or multilayer plastic: sachets, pouches, carry bags, films), III multilayered packaging with at least one non-plastic layer, IV compostable plastic. For the user, all plastic is Dry waste; the category matters mainly for recyclability (flexible and multilayer are hardest to recycle).
Construction and demolition waste. Environment (Construction and Demolition) Waste Management Rules 2025, in force 1 April 2026; apply to construction, demolition, remodelling, renovation and repair. Large projects (built-up area 20,000 sq. m. or more) are "producers" with recycling targets. Households and departments should keep debris separate and not mix it with other waste.
Bio-medical waste. Bio-Medical Waste Management Rules 2016: hospitals, clinics, labs and other healthcare facilities. Under SWM 2026 a household's used needles, syringes and contaminated gauze are special care waste.
Hazardous and lab chemical waste. Hazardous and Other Wastes (Management and Transboundary Movement) Rules 2016: solvents, reagents, used oil and similar. Never bin them; contact the institute's safety or hygiene office. Gas cylinders, fireworks and anything radioactive are never handled by the app's users: advise contacting the authorities.
Reuse first. Usable clothes, books, furniture and working electronics should be donated or reused before disposal, in line with the waste hierarchy.`;
