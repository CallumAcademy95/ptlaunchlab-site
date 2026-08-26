export interface LocationContent {
  marketContext: string;
  opportunity: string;
  whyOnline: string;
  marketSize: string;
}

// Unique content for priority locations
const locationInsights: Record<string, LocationContent> = {
  london: {
    marketContext: "London has the largest concentration of fitness facilities in the UK, with over 1,500 gyms and studios across its 33 boroughs. Demand for qualified personal trainers consistently outstrips supply — particularly in affluent areas like Chelsea, Canary Wharf, and Richmond, where clients routinely pay £60–£100 per session.",
    opportunity: "London's fitness market never stands still. New boutique studios, corporate wellness programmes, and independent gym operators are constantly hiring qualified PTs. With the right qualification and business foundation, London gives you the fastest route from newly qualified to fully booked.",
    whyOnline: "Studying online from London removes the commute burden that makes traditional full-time courses unrealistic. You study around your job, your shifts, or your existing commitments — and you're ready to work in one of the world's most lucrative PT markets the moment you qualify.",
    marketSize: "London accounts for roughly 25% of UK gym memberships. Major operators including PureGym, Virgin Active, David Lloyd, Nuffield Health, and Equinox all have significant London presence, alongside a large independent sector.",
  },
  manchester: {
    marketContext: "Manchester is the UK's second-largest fitness market outside London, with over 400 gyms and studios across the city and Greater Manchester. MediaCity, the Northern Quarter, and the growing Salford Quays area have all driven a surge in demand for premium fitness services over the past decade.",
    opportunity: "Manchester's fitness scene is expanding faster than qualified PTs can fill it. The city's large student population, young professional demographic, and strong sporting culture (home to two Premier League clubs) create a PT client base that's both broad and motivated.",
    whyOnline: "Studying online from Manchester means no fixed class schedule around a city that never stops. Whether you're currently working hospitality, retail, or office hours — you build your qualification around your life, then step into a market that's actively looking for people like you.",
    marketSize: "Greater Manchester has one of the highest gym membership rates in the UK. PureGym, JD Gyms, Nuffield Health and The Gym Group all operate across the region, alongside dozens of independent gyms.",
  },
  birmingham: {
    marketContext: "Birmingham is the UK's second-largest city by population and home to one of the country's most diverse and fast-growing fitness markets. With over 350 gyms across the city and surrounding areas, the demand for qualified personal trainers is substantial and growing year on year.",
    opportunity: "Birmingham's Commonwealth Games legacy in 2022 left a significant infrastructure of world-class sporting facilities and a population more engaged with health and fitness than ever. For newly qualified PTs, this translates to a market with genuine depth across gym floor, corporate wellness, and independent coaching.",
    whyOnline: "Studying online from Birmingham gives you the flexibility to qualify without leaving your current job — whether that's in the Jewellery Quarter, Digbeth, or anywhere across the West Midlands. The market here rewards PTs who can start building clients immediately on qualification.",
    marketSize: "Birmingham and the West Midlands region supports a significant gym economy with major operators including PureGym, The Gym Group, Anytime Fitness, and David Lloyd all operating multiple sites across the region.",
  },
  leeds: {
    marketContext: "Leeds is the commercial hub of Yorkshire and one of the fastest-growing cities in the UK. Its thriving business district, large student population across three major universities, and expanding suburban areas create strong and consistent demand for personal training at every level.",
    opportunity: "Leeds has seen consistent growth in both gym openings and membership numbers over the past five years. The city's mix of students, young professionals, and established families means PT clients range from first-time exercisers to experienced athletes — giving newly qualified trainers a wide target market.",
    whyOnline: "As PT Launch Lab's home region, Leeds and West Yorkshire are at the centre of our gym partner network. Studying online from Leeds gives you the same qualification — and the same guaranteed gym interview — as studying anywhere else in the UK, with the added advantage of our direct local connections.",
    marketSize: "Leeds supports over 200 gyms and fitness facilities across the city and its suburbs. The city is home to multiple PureGym, The Gym Group and Nuffield Health sites, alongside a large independent sector.",
  },
  liverpool: {
    marketContext: "Liverpool's waterfront regeneration and growing tourism economy have driven a significant expansion of its fitness industry over the past decade. The city's strong working-class fitness culture, combined with a growing professional demographic, creates a broad PT market across multiple income brackets.",
    opportunity: "Liverpool's gym scene continues to grow, with new facilities opening across the Baltic Triangle, the docks area, and outlying suburbs. For qualified PTs, this means a market still catching up with demand — particularly for trainers who combine strong technical knowledge with the business skills to build their own client base.",
    whyOnline: "Studying online from Liverpool means you can qualify while working around Merseyside's shift-based economy — whether you're in hospitality, retail, or already working in a gym. You complete your qualification on your schedule, then step into a market that's actively hiring.",
    marketSize: "Merseyside supports over 200 gyms and fitness facilities. Major operators including PureGym, JD Gyms, The Gym Group, and Anytime Fitness have growing presence across Liverpool, Birkenhead, and the wider region.",
  },
  sheffield: {
    marketContext: "Sheffield's two major universities give it one of the largest student populations in the UK, creating a consistent and high-volume gym membership base. The city also has a strong outdoor fitness culture, with easy access to the Peak District driving demand for fitness professionals who can serve active clients at all levels.",
    opportunity: "Sheffield is in the middle of a significant city centre reinvestment that's bringing new fitness facilities and expanding the market for qualified PTs. The combination of student demand, a growing tech sector, and an established sporting culture makes it a well-rounded market for newly qualified trainers.",
    whyOnline: "Studying online from Sheffield means no fixed lecture times around a city where shift work, part-time jobs, and student schedules dominate. You build your qualification around your actual life, not a timetable set by someone else.",
    marketSize: "Sheffield and South Yorkshire support over 150 gyms and fitness facilities. The city has strong PureGym, The Gym Group, and Nuffield Health presence alongside a large independent gym sector.",
  },
  bristol: {
    marketContext: "Bristol consistently ranks among the UK's healthiest cities, with one of the highest rates of fitness engagement outside London. The city's health-conscious, educated demographic and strong independent business culture have driven a boom in boutique studios, outdoor fitness providers, and premium personal training.",
    opportunity: "Bristol's fitness market is characterised by clients who are willing to invest in quality personal training and who value trainers with genuine credentials and business professionalism. For newly qualified PTs, this means a market where a strong qualification and business foundation directly translates to higher earning potential.",
    whyOnline: "Studying online from Bristol fits the city's ethos — flexible, self-directed, and built around your life. You don't lose income while you study, and you enter a market where qualified, professional trainers are genuinely sought after.",
    marketSize: "Bristol and the surrounding area support over 200 fitness facilities. The city has a thriving mix of national operators and independent gyms — all of which recognise NCFE Level 3 as the standard qualification for PT employment.",
  },
  newcastle: {
    marketContext: "Newcastle and the Tyne & Wear area have one of the strongest gym cultures in the UK — a region where fitness is a genuine priority for a broad demographic. The city's regeneration, growing tech sector, and student population across three universities create strong and consistent PT demand.",
    opportunity: "Newcastle's fitness market has grown significantly over the past five years, with new gym openings across the city centre, Gateshead, and outlying areas. For qualified PTs, this means a market that's actively growing — with real opportunities for both employed and self-employed routes.",
    whyOnline: "Studying online from Newcastle means qualifying on a schedule that works around the North East's economy — whether you're in hospitality, retail, healthcare, or already gym-based. No commuting to college. No fixed schedule. Just progress at your own pace.",
    marketSize: "Tyne & Wear supports over 150 gyms and fitness facilities across Newcastle, Gateshead, Sunderland, and surrounding areas. Major operators and independents all actively recruit NCFE and CIMSPA-recognised PTs.",
  },
  edinburgh: {
    marketContext: "Edinburgh is Scotland's capital and home to one of the most affluent fitness markets in the UK. The city's large professional population, thriving tourism economy, and strong university presence create demand for personal training at both the premium and accessible ends of the market.",
    opportunity: "Edinburgh's PT market is characterised by clients who value credentials and professionalism. An NCFE Level 3 qualification with CIMSPA recognition is the accepted standard, and trainers who combine technical knowledge with solid business skills consistently outperform those who only have the exam pass.",
    whyOnline: "Studying online from Edinburgh removes the need to travel to training facilities in Scotland's often-expensive central belt. You qualify on your terms, and you enter a market where the quality of your qualification — and the business skills that come with it — directly determines your earning power.",
    marketSize: "Edinburgh supports over 150 gyms and fitness facilities, with a strong presence of premium operators including David Lloyd, Virgin Active, and Nuffield Health alongside a growing boutique studio sector.",
  },
  glasgow: {
    marketContext: "Glasgow is Scotland's largest city and home to its biggest fitness market. A strong working-class gym culture, combined with significant investment in the city's East End and growing professional districts, creates a PT market that's both high-volume and increasingly premium.",
    opportunity: "Glasgow's gym sector has grown significantly since the 2014 Commonwealth Games redevelopment, with new facilities opening across the city. For qualified PTs, the combination of high population density, strong gym culture, and a market that genuinely values qualified professionals makes Glasgow one of Scotland's best PT career destinations.",
    whyOnline: "Studying online from Glasgow means qualifying without the cost or disruption of attending a residential or classroom-based course. The qualification you earn is identical to those taken anywhere in the UK — and it opens the same doors.",
    marketSize: "Greater Glasgow supports over 300 gyms and fitness facilities. Major operators including PureGym, The Gym Group, Nuffield Health, and David Lloyd all operate multiple Glasgow sites.",
  },
  cardiff: {
    marketContext: "Cardiff is the capital and commercial centre of Wales, and home to the country's largest and most developed fitness market. The city's strong rugby culture, large student population across two major universities, and growing professional demographic create broad and consistent demand for qualified personal trainers.",
    opportunity: "Cardiff's fitness industry has grown significantly over the past decade, with new gym openings across the city centre, Bay area, and suburban neighbourhoods. Newly qualified PTs with the right credentials and business knowledge are well-positioned to enter a market that's still expanding.",
    whyOnline: "Studying online from Cardiff means qualifying around your existing commitments — whether you're studying, working, or already gym-based in Wales. The qualification is UK-wide, and Ofqual regulation is what makes it portable between employers.",
    marketSize: "Cardiff and the South Wales area support over 150 gyms and fitness facilities. National operators including PureGym, The Gym Group, and Nuffield Health all have Cardiff presence alongside a growing independent gym sector.",
  },
  nottingham: {
    marketContext: "Nottingham is the commercial hub of the East Midlands and home to one of England's largest student populations, split across two major universities. This creates a high-volume gym membership base alongside a growing professional sector — both of which create strong PT demand.",
    opportunity: "Nottingham's fitness market serves a wide demographic, from students seeking affordable fitness coaching to professionals willing to invest in premium personal training. For newly qualified PTs, this breadth is an advantage — there are genuine routes to full-time income at multiple price points.",
    whyOnline: "Studying online from Nottingham means qualifying on your schedule, whether you're a student, shift worker, or working professional. No fixed attendance. No disruption to your income. Just a recognised qualification at the end of it.",
    marketSize: "Nottingham and the surrounding East Midlands area support over 200 gyms and fitness facilities, with strong national operator presence and a growing independent sector that values NCFE Level 3 qualified trainers.",
  },
  leicester: {
    marketContext: "Leicester has one of the UK's most diverse populations, creating a personal training market with genuine breadth — from performance-focused athletes to clients seeking first-time lifestyle coaching. The city's strong South Asian community, in particular, has driven growing demand for culturally aware fitness professionals.",
    opportunity: "Leicester's fitness industry is expanding alongside the city's wider economic growth. For qualified PTs who understand how to build a client base across a diverse community, Leicester offers real opportunities that less diverse markets don't.",
    whyOnline: "Studying online from Leicester means qualifying without disrupting your income or your commitments in one of the UK's most economically active cities. The qualification is nationally recognised and opens doors across the East Midlands and beyond.",
    marketSize: "Leicester and Leicestershire support over 150 gyms and fitness facilities. The city has national operator presence alongside a strong independent gym sector — both of which hire NCFE-qualified, CIMSPA-recognised personal trainers.",
  },
  brighton: {
    marketContext: "Brighton is one of the UK's most health-conscious cities, with a premium fitness market driven by an affluent, lifestyle-focused demographic. The city's outdoor culture, beach access, and strong wellness economy create demand for personal trainers who combine fitness expertise with strong client communication.",
    opportunity: "Brighton's PT market operates at the premium end of the national spectrum. Clients here expect professional credentials, genuine expertise, and a business-like approach — which is exactly what PT Launch Lab's combined qualification and business training delivers.",
    whyOnline: "Studying online from Brighton means qualifying around the city's seasonally variable economy — no fixed timetable around hospitality or retail shifts. You build your qualification when it fits your life, then step into a market that rewards professionalism.",
    marketSize: "Brighton and Hove support over 120 gyms and fitness facilities, with a strong mix of national operators and premium independent studios that all recognise NCFE Level 3 as the standard qualification for PT employment.",
  },
  "southampton": {
    marketContext: "Southampton's large port economy, naval presence, and two universities create a broad and varied personal training market — from performance-focused clients in the maritime sector to students and young professionals seeking lifestyle coaching.",
    opportunity: "Southampton's fitness market is growing alongside the city's expanding residential and commercial areas. For qualified PTs, the city offers a range of employment settings — from large gym chains to boutique studios to self-employed client building — across a population that takes fitness seriously.",
    whyOnline: "Studying online from Southampton means qualifying around the city's shift-based and seasonal economy. No fixed attendance. No commute to a training facility. Just a nationally recognised qualification that opens doors across the South coast.",
    marketSize: "Southampton and the surrounding Hampshire area support over 150 gyms and fitness facilities. National operators and independent gyms all recognise NCFE Level 3 as the standard PT qualification.",
  },
  hull: {
    marketContext: "Hull and the East Yorkshire coast have seen significant investment in fitness infrastructure over the past decade, with the city's UK City of Culture legacy driving renewed focus on community health and wellbeing. The city's compact geography means gyms serve dense, loyal memberships — giving PTs strong client retention potential.",
    opportunity: "Hull's PT market is less saturated than major cities, creating genuine opportunity for newly qualified trainers who are prepared to build their client base professionally. The business training built into the PT Launch Lab course is specifically designed for this kind of market entry.",
    whyOnline: "Studying online from Hull means qualifying without travelling to training facilities in Leeds or Sheffield. You get the same NCFE Level 3 qualification, the same personal tutor, and the same guaranteed gym interview — from your own city.",
    marketSize: "Hull and East Yorkshire support over 100 gyms and fitness facilities. National operators including PureGym and The Gym Group have Hull presence alongside a strong independent gym sector.",
  },
};

// Regional fallback content
const regionInsights: Record<string, LocationContent> = {
  "West Yorkshire": {
    marketContext: "West Yorkshire is PT Launch Lab's home region — the heart of our gym partner network and the market we know better than any other. The region's mix of major cities, commuter towns, and suburban areas creates a broad and accessible PT market with strong employment opportunities.",
    opportunity: "West Yorkshire's fitness market is growing alongside the region's wider economic development. Leeds, Bradford, Huddersfield, and Wakefield all have active gym sectors that regularly recruit qualified PTs — and PT Launch Lab's direct relationships with gym operators give our graduates a real advantage.",
    whyOnline: "Studying online from West Yorkshire means qualifying in PT Launch Lab's own backyard. Our gym partner network is strongest here, and our founders' relationships with local gym operators are direct and longstanding.",
    marketSize: "West Yorkshire supports hundreds of gyms and fitness facilities across its five metropolitan districts. From national chains to independent operators, the demand for NCFE-qualified, CIMSPA-recognised personal trainers is consistent and well-established.",
  },
  "South Yorkshire": {
    marketContext: "South Yorkshire's major cities — Sheffield, Rotherham, Barnsley, and Doncaster — collectively support one of the North's most active fitness markets. The region's strong sporting culture, student populations, and ongoing urban regeneration all drive demand for qualified personal trainers.",
    opportunity: "South Yorkshire's fitness market continues to grow, with new facilities opening across the region. For newly qualified PTs with the right credentials and business foundation, there are genuine employment routes — both employed and self-employed — across multiple towns and cities.",
    whyOnline: "Studying online from South Yorkshire means qualifying around the region's varied employment landscape — shift work, manufacturing, retail, or professional services. You build your qualification on your schedule, not someone else's.",
    marketSize: "South Yorkshire supports over 200 gyms and fitness facilities. Major national operators have strong regional presence, and independent gyms across Sheffield and the surrounding area consistently recruit NCFE Level 3 qualified PTs.",
  },
  "North Yorkshire": {
    marketContext: "North Yorkshire's mix of market towns, coastal resorts, and rural communities creates a varied PT market. Harrogate's affluent demographic, York's tourism economy, and Scarborough's year-round residential population all generate demand for qualified personal trainers at different price points.",
    opportunity: "North Yorkshire rewards PTs who can build a self-employed client base — the region's spread-out geography means employed gym roles are fewer, but the demographic quality of clients, particularly around Harrogate and York, creates strong earning potential for trainers who invest in their business skills.",
    whyOnline: "Studying online from North Yorkshire removes the need to travel to major cities for training. You qualify at home, on your schedule — and the business training built into our course specifically prepares you for the self-employed model that works best in markets like this.",
    marketSize: "North Yorkshire supports gyms and fitness facilities across its major towns, with Harrogate and York each supporting a premium fitness market that values qualified, professional personal trainers.",
  },
  "East Yorkshire": {
    marketContext: "East Yorkshire's fitness market is centred on Hull but extends across a region with strong community gym culture and growing investment in health infrastructure. The area's loyal membership bases and tight-knit communities create strong client retention potential for newly qualified PTs.",
    opportunity: "East Yorkshire's PT market is growing as the region invests in health and fitness infrastructure. For newly qualified trainers, the lower competition compared to major cities creates real opportunity to establish a client base quickly — particularly with the business skills to market yourself effectively.",
    whyOnline: "Studying online from East Yorkshire means qualifying without travelling to Leeds or Sheffield. You get the same nationally recognised qualification, the same personal tutor, and the same guaranteed gym interview — from your own area.",
    marketSize: "East Yorkshire supports gyms and fitness facilities across Hull, Beverley, Bridlington, and surrounding towns, with a mix of national operators and independent gyms that regularly recruit NCFE-qualified personal trainers.",
  },
  "Greater Manchester": {
    marketContext: "Greater Manchester is one of the UK's most dynamic fitness markets — a region of 2.8 million people spread across ten boroughs, each with its own gym infrastructure and PT demand. The region's economy, cultural pull, and large student population make it one of the most active personal training markets outside London.",
    opportunity: "Greater Manchester's fitness sector continues to expand, with new facilities opening across city centre Manchester, Salford, Stockport, Bolton, and the region's many commuter towns. For qualified PTs, the scale of the market means employment opportunities across every type of setting — from premium clubs to budget gyms to self-employed.",
    whyOnline: "Studying online from Greater Manchester means qualifying around one of the UK's busiest urban economies. No fixed commute to a training facility. No disruption to your income. Just a recognised qualification that opens doors across the whole region.",
    marketSize: "Greater Manchester supports over 400 gyms and fitness facilities. The national operators all have significant Manchester presence, and the independent sector is large.",
  },
  "Merseyside": {
    marketContext: "Merseyside's fitness market spans Liverpool, Wirral, St Helens, Knowsley, and Sefton — a combined population of over 1.4 million with strong gym culture and growing demand for qualified personal trainers. Liverpool's city centre and the wider regeneration of the waterfront area have driven particular growth in premium fitness.",
    opportunity: "Merseyside's PT market is expanding alongside the region's economic growth. Liverpool in particular has seen strong investment in fitness infrastructure, creating employment opportunities for qualified PTs across both employed and self-employed routes.",
    whyOnline: "Studying online from Merseyside means qualifying around the region's economy — from Liverpool city centre to Wirral suburbs. No fixed schedule. No disruption to your current income. Just progress at your own pace.",
    marketSize: "Merseyside supports over 200 gyms and fitness facilities across its five local authority areas. Major national operators and independent gyms regularly recruit NCFE-qualified, CIMSPA-recognised personal trainers throughout the region.",
  },
  "West Midlands": {
    marketContext: "The West Midlands is the UK's second-largest metropolitan area by population, with a fitness market that reflects its economic and demographic diversity. Birmingham anchors the region's premium market, while surrounding towns — Coventry, Wolverhampton, Dudley, Solihull — each have their own strong gym sectors.",
    opportunity: "The West Midlands offers newly qualified PTs one of the UK's broadest ranges of employment settings — from budget gym chains to premium health clubs to boutique studios. The region's scale means there is genuine demand at every market level.",
    whyOnline: "Studying online from the West Midlands means qualifying across one of the UK's most economically active regions without disrupting your income. The qualification is nationally recognised and opens doors across all of Birmingham, Coventry, and the wider conurbation.",
    marketSize: "The West Midlands supports over 400 gyms and fitness facilities across its urban centres. The national operators all have significant regional presence, alongside a large independent sector.",
  },
  "East Midlands": {
    marketContext: "The East Midlands — spanning Nottingham, Leicester, Derby, and Northampton — is one of England's most active fitness regions. Strong student populations, a growing professional demographic, and significant investment in new fitness facilities create consistent PT demand across the region.",
    opportunity: "The East Midlands' fitness market continues to grow, with new gym openings in all four of the region's major cities. For newly qualified PTs, this is a region where the combination of a recognised qualification and strong business skills translates quickly to employment.",
    whyOnline: "Studying online from the East Midlands means qualifying around the region's varied economy — manufacturing, logistics, retail, or professional services. No fixed timetable. Progress at the pace that works for you.",
    marketSize: "The East Midlands supports over 300 gyms and fitness facilities across Nottingham, Leicester, Derby, Northampton, and surrounding areas — with national operators and independent gyms all recognising NCFE Level 3.",
  },
  "London": {
    marketContext: "London has the largest concentration of fitness facilities in the UK, with over 1,500 gyms and studios across its 33 boroughs. Demand for qualified personal trainers consistently outstrips supply, and the capital's fitness market operates at the premium end of national earning potential.",
    opportunity: "London's fitness market never stands still. New boutique studios, corporate wellness programmes, and independent gym operators are constantly hiring qualified PTs. With the right qualification and business foundation, London gives you the fastest route from newly qualified to fully booked.",
    whyOnline: "Studying online from London removes the commute burden that makes traditional full-time courses unrealistic in the capital. You study around your job, your shifts, or your existing commitments — and you're ready to work in one of the world's most lucrative PT markets the moment you qualify.",
    marketSize: "London accounts for roughly 25% of UK gym memberships. Major operators including PureGym, Virgin Active, David Lloyd, Nuffield Health, and Equinox all have significant London presence, alongside a large independent sector.",
  },
  "South East England": {
    marketContext: "The South East is home to some of the UK's wealthiest commuter towns and coastal cities, creating a premium personal training market that extends well beyond London. Areas like Surrey, Kent, Sussex, and Berkshire have active gym sectors with clients willing to invest significantly in qualified personal training.",
    opportunity: "The South East's high household incomes and health-conscious demographic create strong earning potential for qualified PTs — particularly those who combine a recognised qualification with the business skills to build and retain a private client base.",
    whyOnline: "Studying online from the South East means qualifying around a region where commuting times and busy schedules make fixed-attendance courses impractical. You qualify at your pace, then enter a market that values professional credentials.",
    marketSize: "The South East supports hundreds of gyms and fitness facilities across Surrey, Kent, Sussex, Hampshire, and Berkshire — with both national operators and premium independent clubs actively hiring NCFE-qualified, CIMSPA-recognised PTs.",
  },
  "South West England": {
    marketContext: "The South West — spanning Bristol, Bath, Exeter, Plymouth, and the wider region — has one of the UK's strongest fitness cultures. Bristol in particular leads nationally for health engagement, and the region's outdoor lifestyle, university towns, and growing professional demographic all create consistent PT demand.",
    opportunity: "The South West's fitness market rewards trainers who combine technical credentials with the ability to build their own client base. The region has a strong tradition of self-employed fitness professionals, and the business training built into the PT Launch Lab course is specifically designed to support this route.",
    whyOnline: "Studying online from the South West means qualifying without travelling to large city training facilities. Whether you're in Bristol, Bath, Exeter, or a smaller town, you access the same qualification, the same tutor, and the same guaranteed gym interview.",
    marketSize: "The South West supports hundreds of gyms and fitness facilities across its major cities and market towns. National operators and independent gyms both recognise NCFE Level 3 as the standard PT qualification across the region.",
  },
  "Scotland": {
    marketContext: "Scotland's fitness market is centred on Glasgow and Edinburgh but extends across a region with strong gym culture in cities like Aberdeen, Dundee, and Inverness. Scotland has seen significant investment in fitness infrastructure over the past decade, with major chains expanding their presence and independent gyms growing.",
    opportunity: "Scotland's PT market continues to grow, with new facilities opening across its central belt and major cities. For qualified PTs, Scotland offers genuine employment opportunities in both employed and self-employed routes — with the added benefit of lower market saturation than England's major cities.",
    whyOnline: "Studying online from Scotland means accessing a nationally recognised qualification without travelling south. Your NCFE Level 3 is equally valid in Scotland as it is in England — and PT Launch Lab's business training prepares you for every regional market.",
    marketSize: "Scotland supports over 600 gyms and fitness facilities across its populated areas. Major national operators including PureGym, The Gym Group, Nuffield Health, and David Lloyd all have Scottish presence.",
  },
  "Wales": {
    marketContext: "Wales has a growing fitness market centred on Cardiff but extending across its major urban areas including Swansea, Newport, and the South Wales Valleys. A strong sporting culture — anchored by rugby — and growing health awareness have driven consistent investment in fitness infrastructure across the country.",
    opportunity: "Wales offers newly qualified PTs genuine employment opportunities in a market that continues to grow. Cardiff in particular has seen strong gym sector expansion, and the wider South Wales area has active fitness communities that value qualified, professional personal trainers.",
    whyOnline: "Studying online from Wales means accessing a UK-wide qualification without travelling to English training centres. Your NCFE Level 3 is fully recognised across Wales, and PT Launch Lab's support network extends to all of the UK.",
    marketSize: "Wales supports over 250 gyms and fitness facilities across its urban areas, with national operators and independent gyms both regularly hiring NCFE-qualified, CIMSPA-recognised personal trainers.",
  },
  "Northern Ireland": {
    marketContext: "Northern Ireland's fitness market is centred on Belfast but extends across a region with strong community gym culture in Derry/Londonderry, Lisburn, and the surrounding towns. The province has seen significant investment in fitness infrastructure over the past decade, with major chains and independent operators both growing.",
    opportunity: "Northern Ireland's PT market offers genuine opportunities for newly qualified trainers — particularly in Belfast, where a growing professional sector and expanding gym infrastructure create demand for qualified, business-ready personal trainers.",
    whyOnline: "Studying online from Northern Ireland means accessing a UK-wide qualification from home. Your NCFE Level 3 is regulated by Ofqual and holds across the UK, and PT Launch Lab's support covers every region of it.",
    marketSize: "Northern Ireland supports over 150 gyms and fitness facilities, with national operators and independent gyms both recognising NCFE Level 3 as the standard PT qualification.",
  },
};

// Generic fallback for any location not specifically covered
const genericContent: LocationContent = {
  marketContext: "The UK fitness industry employs over 100,000 personal trainers and continues to grow year on year. Demand for qualified PTs remains strong across the country, in market towns as well as major cities.",
  opportunity: "Regardless of where you're based, the fundamentals of a successful PT career are the same: a recognised qualification, a strong business foundation, and the ability to build and retain a client base. PT Launch Lab delivers all three — and the guaranteed gym interview applies wherever in the UK you are.",
  whyOnline: "Studying online means your location doesn't limit your ability to qualify. Whether you're in a major city or a smaller town, you access the same NCFE Level 3 qualification, the same personal tutor, and the same business training that our graduates have used to build PT careers across the UK.",
  marketSize: "The UK gym market is worth over £5 billion and supports thousands of facilities nationwide. NCFE Level 3 is regulated by Ofqual under reference 603/4388/6, which is what makes it portable between employers rather than tied to the provider who taught it.",
};

export function getLocationContent(slug: string, region: string): LocationContent {
  // Try exact location match first
  if (locationInsights[slug]) return locationInsights[slug];
  // Fall back to region
  if (regionInsights[region]) return regionInsights[region];
  // Generic fallback
  return genericContent;
}
