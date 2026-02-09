
import { GraduationCap, Globe, Users, TrendingUp, Award, Clock, BookOpen, MapPin, Plane, FileText, Shield, Calendar } from 'lucide-react';

export interface VisaTypeDetail {
    image?: string;
    heroText: string;
    overview: string;
    statistics: {
        label: string;
        value: string;
        icon: any;
    }[];
    highlights: string[];
    mainListLabel: string;
    mainList: string[];
    subListLabel: string;
    subList: string[];
    costOfLiving: {
        category: string;
        range: string;
    }[];
    visaRequirements: string[];
    whyContent: string;
}

export interface DestinationDetail {
    id: string;
    country: string;
    flag: string;
    image: string;
    study: VisaTypeDetail;
    visit: VisaTypeDetail;
}

export const DESTINATIONS_DATA: Record<string, DestinationDetail> = {
    usa: {
        id: 'usa',
        country: 'USA',
        flag: 'us',
        image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Unlock Global Opportunities in the Land of Innovation',
            overview: 'The United States remains the world\'s top destination for international students, offering a diverse range of institutions, cutting-edge research opportunities, and a vibrant cultural landscape.',
            statistics: [
                { label: 'Universities', value: '4000+', icon: GraduationCap },
                { label: 'Intl. Students', value: '1M+', icon: Users },
                { label: 'Post-Study Work', value: '1-3 Years', icon: Clock },
                { label: 'Scholarships', value: 'Available', icon: Award },
            ],
            highlights: [
                'Home to Ivy League and world-ranked institutions',
                'Strong focus on research and innovation',
                'Diverse campus culture and networking',
                'OPT (Optional Practical Training) opportunities',
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'Harvard University',
                'Stanford University',
                'MIT',
                'University of California, Berkeley',
                'Columbia University'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Computer Science & IT',
                'Business & Management',
                'Engineering',
                'Data Science',
                'Life Sciences'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: '$800 - $1,500 / month' },
                { category: 'Food & Groceries', range: '$300 - $500 / month' },
                { category: 'Transport', range: '$50 - $100 / month' },
                { category: 'Total Monthly', range: '$1,200 - $2,500' }
            ],
            visaRequirements: [
                'Form I-20 (Certificate of Eligibility)',
                'F-1 Student Visa Application',
                'SEVIS Fee Payment',
                'Proof of Financial Support',
                'English Proficiency (IELTS/TOEFL)'
            ],
            whyContent: 'Studying in the USA provides access to unparalleled academic resources, industry connections, and a global perspective that is highly valued by employers worldwide.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Discover the Spirit of North America',
            overview: 'From the neon lights of Times Square to the natural majesty of the Grand Canyon, the USA offers an endless variety of experiences for every traveler.',
            statistics: [
                { label: 'Visa Type', value: 'B1/B2 Tourist', icon: Plane },
                { label: 'Validity', value: 'Up to 10 Years', icon: Calendar },
                { label: 'Processing', value: '3-5 Weeks', icon: Clock },
                { label: 'Annual Visitors', value: '79M+', icon: Users },
            ],
            highlights: [
                'Iconous cities and national parks',
                'World-class entertainment and shopping',
                'Diverse culinary experiences',
                'Extensive internal travel network'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'Statue of Liberty, NYC',
                'Grand Canyon, Arizona',
                'Walt Disney World, Orlando',
                'Golden Gate Bridge, SF',
                'Las Vegas Strip'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Road Tripping Route 66',
                'Hiking National Parks',
                'Broadway Shows',
                'Tech Hub Tours',
                'Professional Sports Games'
            ],
            costOfLiving: [
                { category: 'Tourist Hotel', range: '$150 - $300 / night' },
                { category: 'Meals & Dining', range: '$50 - $100 / day' },
                { category: 'Local Transport', range: '$20 - $50 / day' },
                { category: 'Daily Budget', range: '$250 - $500' }
            ],
            visaRequirements: [
                'Valid Passport (6 months+)',
                'DS-160 Form Confirmation',
                'Visa Interview Appointment',
                'Proof of Funds',
                'Travel Itinerary'
            ],
            whyContent: 'The USA offers a combination of urban excitement and natural beauty that is unique in the world, making it a bucket-list destination for everyone.'
        }
    },
    uk: {
        id: 'uk',
        country: 'UK',
        flag: 'gb',
        image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Excellence in Education with a Historic Legacy',
            overview: 'The United Kingdom offers globally recognized degrees, world-class teaching methodology, and a rich academic history spanning centuries.',
            statistics: [
                { label: 'Universities', value: '160+', icon: GraduationCap },
                { label: 'Study Duration', value: '1-3 Years', icon: Clock },
                { label: 'Graduate Route', value: '2 Years', icon: Clock },
                { label: 'Intake', value: 'Sept/Jan', icon: BookOpen },
            ],
            highlights: [
                'Short duration degrees (Masters in 1 year)',
                'NHS health surcharge coverage',
                'Multicultural environment',
                'Part-time work (20 hrs/week) permitted'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'University of Oxford',
                'University of Cambridge',
                'Imperial College London',
                'UCL',
                'University of Edinburgh'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Business Management',
                'Computer Science',
                'Law',
                'Medicine & Health',
                'Creative Arts'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: '£500 - £1,200 / month' },
                { category: 'Food & Groceries', range: '£200 - £400 / month' },
                { category: 'Transport', range: '£40 - £80 / month' },
                { category: 'Total Monthly', range: '£800 - £1,800' }
            ],
            visaRequirements: [
                'CAS (Confirmation of Acceptance for Studies)',
                'Student Visa (Tier 4)',
                'Proof of Financial Funds',
                'IELTS for UKVI',
                'Tuberculosis (TB) Test'
            ],
            whyContent: 'The UK\'s education system is designed to fast-track your career with intensive programs and a focus on critical thinking and practical experience.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Experience the Timeless Charm of the United Kingdom',
            overview: 'From the historic streets of London to the rugged highlands of Scotland, the UK is a treasure trove of culture, history, and natural beauty.',
            statistics: [
                { label: 'Visa Type', value: 'Standard Visitor', icon: Plane },
                { label: 'Stay Duration', value: 'Up to 6 Months', icon: Clock },
                { label: 'Processing', value: '15 Working Days', icon: Calendar },
                { label: 'Visitors', value: '40M / Year', icon: Users },
            ],
            highlights: [
                'Rich royal heritage',
                'Vibrant cultural hubs',
                'Historic architecture',
                'Diverse natural landscapes'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'London Eye & Big Ben',
                'Edinburgh Castle',
                'Stonehenge, Amesbury',
                'The British Museum',
                'Windsor Castle'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'West End Theatre Shows',
                'Highland Tours',
                'Afternoon Tea in London',
                'Cotswolds Village Walks',
                'Premier League Matches'
            ],
            costOfLiving: [
                { category: 'Hotel Stay', range: '£100 - £250 / night' },
                { category: 'Dining Out', range: '£30 - £60 / day' },
                { category: 'Local Travel', range: '£15 - £30 / day' },
                { category: 'Daily Budget', range: '£150 - £350' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Proof of Financial Means',
                'Flight & Hotel Bookings',
                'Travel Itinerary',
                'Employment Proof'
            ],
            whyContent: 'The UK offers an unparalleled mix of the ancient and the modern, with world-class events, museums, and natural sites that cater to every interest.'
        }
    },
    canada: {
        id: 'canada',
        country: 'Canada',
        flag: 'ca',
        image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Quality Living and World-Class Education',
            overview: 'Canada is known for its welcoming culture, high quality of life, and excellent post-graduation work opportunities and pathway to permanent residency.',
            statistics: [
                { label: 'Ranking', value: 'Top 10 Globally', icon: Award },
                { label: 'PGWP', value: 'Up to 3 Years', icon: Clock },
                { label: 'Visa Success', value: 'High', icon: TrendingUp },
                { label: 'Work while study', value: 'Yes', icon: Users },
            ],
            highlights: [
                'Affordable tuition compared to US/UK',
                'PGWP (Post-Graduation Work Permit)',
                'Pathways to Permanent Residency',
                'Multicultural and safe environment'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'University of Toronto',
                'University of British Columbia',
                'McGill University',
                'University of Waterloo',
                'University of Alberta'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Project Management',
                'IT & Software Engineering',
                'Supply Chain Management',
                'Early Childhood Education',
                'Finance'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: 'CAD 600 - CAD 1,500 / month' },
                { category: 'Food & Groceries', range: 'CAD 300 - CAD 500 / month' },
                { category: 'Transport', range: 'CAD 80 - CAD 120 / month' },
                { category: 'Total Monthly', range: 'CAD 1,000 - CAD 2,200' }
            ],
            visaRequirements: [
                'Letter of Acceptance (LOA)',
                'GIC (Guaranteed Investment Certificate)',
                'Study Permit Application',
                'Medical Examination',
                'IELTS (SDS/Non-SDS)'
            ],
            whyContent: 'Canada offers a unique blend of academic excellence and career growth, with a strong emphasis on welcoming international talent into its workforce.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Discover the Great White North',
            overview: 'Experience Canada\'s breathtaking landscapes, from the Rocky Mountains to the vibrant streets of Toronto and Vancouver.',
            statistics: [
                { label: 'Visa Type', value: 'Visitor Visa / eTA', icon: Plane },
                { label: 'Stay Duration', value: 'Up to 6 Months', icon: Clock },
                { label: 'Processing', value: '10-20 Days', icon: Calendar },
                { label: 'Visitors', value: '22M / Year', icon: Users },
            ],
            highlights: [
                'Breathtaking national parks',
                'Diverse multicultural cities',
                'World-class ski resorts',
                'Unspoiled natural wilderness'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'Niagara Falls, Ontario',
                'Banff National Park',
                'CN Tower, Toronto',
                'Old Montreal',
                'Stanley Park, Vancouver'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Skiing in Whistler',
                'Northern Lights Viewing',
                'Canoeing in Lake Louise',
                'Maple Syrup Tasting',
                'Ice Hockey Matches'
            ],
            costOfLiving: [
                { category: 'Hotel Stay', range: 'CAD 150 - CAD 350 / night' },
                { category: 'Food & Dining', range: 'CAD 50 - CAD 100 / day' },
                { category: 'Local Travel', range: 'CAD 20 - CAD 40 / day' },
                { category: 'Daily Budget', range: 'CAD 200 - CAD 500' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Proof of Financial Support',
                'Travel Itinerary',
                'Invitation Letter (if any)',
                'Ties to Home Country'
            ],
            whyContent: 'Canada is a year-round destination offering everything from vibrant urban culture to some of the most spectacular natural wonders on Earth.'
        }
    },
    australia: {
        id: 'australia',
        country: 'Australia',
        flag: 'au',
        image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Innovation and Adventure in Higher Education',
            overview: 'Australia is a global leader in research and innovation, offering a wide range of courses and world-ranked universities in some of the world\'s most liveable cities.',
            statistics: [
                { label: 'Group of 8', value: 'Top Research', icon: GraduationCap },
                { label: 'Liveability', value: 'Top Ranked', icon: MapPin },
                { label: 'PSW Duration', value: '2-5 Years', icon: Clock },
                { label: 'Scholarships', value: 'AUD 200M+', icon: Award },
            ],
            highlights: [
                'ESOS Act protecting student interests',
                'Extensive Post-Study Work rights',
                'Vibrant outdoor lifestyle',
                'Strong research focus (CSIRO)'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'University of Melbourne',
                'University of Sydney',
                'University of Queensland',
                'Monash University',
                'UNSW Sydney'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Civil Engineering',
                'Accountancy',
                'Cyber Security',
                'Mining & Petroleum',
                'Healthcare'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: 'AUD 700 - AUD 1,600 / month' },
                { category: 'Food & Groceries', range: 'AUD 350 - AUD 550 / month' },
                { category: 'Transport', range: 'AUD 100 - AUD 150 / month' },
                { category: 'Total Monthly', range: 'AUD 1,200 - AUD 2,500' }
            ],
            visaRequirements: [
                'eCoE (Electronic Confirmation of Enrolment)',
                'Student Visa (Subclass 500)',
                'Genuine Student (GS) Requirement',
                'OSHC (Overseas Student Health Cover)',
                'English Proficiency'
            ],
            whyContent: 'Australia provides a supportive education ecosystem with high standards of living and excellent career prospects in diverse sectors.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Adventure Awaits in the Land Down Under',
            overview: 'Discover Australia\'s unique wildlife, stunning beaches, and iconic landmarks like the Great Barrier Reef and Sydney Opera House.',
            statistics: [
                { label: 'Visa Type', value: 'Subclass 600', icon: Plane },
                { label: 'Stay Duration', value: '3-12 Months', icon: Clock },
                { label: 'Processing', value: '5-15 Days', icon: Calendar },
                { label: 'Visitors', value: '9M / Year', icon: Users },
            ],
            highlights: [
                'Iconic coastal drives',
                'Unique wildlife (Kangaroos/Koalas)',
                'World-class diving sites',
                'Modern, friendly cities'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'Sydney Opera House',
                'Great Barrier Reef',
                'Uluru (Ayers Rock)',
                'Great Ocean Road',
                'Bondi Beach'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Scuba Diving & Snorkeling',
                'Surfing Lessons',
                'Outback Expeditions',
                'Wine Tasting (Barossa)',
                'City Bridge Climbs'
            ],
            costOfLiving: [
                { category: 'Boutique Hotel', range: 'AUD 200 - AUD 400 / night' },
                { category: 'Dining & Drinks', range: 'AUD 60 - AUD 120 / day' },
                { category: 'City Travel', range: 'AUD 15 - AUD 30 / day' },
                { category: 'Daily Budget', range: 'AUD 300 - AUD 600' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Evidence of Funds',
                'Health & Character Check',
                'Travel Medical Insurance',
                'Intention to Return'
            ],
            whyContent: 'Australia is a destination like no other, offering experiences that range from cosmopolitan city life to the raw beauty of the outback.'
        }
    },
    europe: {
        id: 'europe',
        country: 'Europe',
        flag: 'eu',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Affordable Quality and Cultural Immersion',
            overview: 'Europe offers a mix of low-tuition or tuition-free universities (like in Germany), rich history, and the opportunity to experience multiple cultures within the Schengen zone.',
            statistics: [
                { label: 'Intake', value: 'Sept/Winter', icon: Calendar },
                { label: 'Tuition', value: 'Low/Free', icon: Award },
                { label: 'Heritage', value: 'Rich History', icon: Globe },
                { label: 'Schengen Access', value: 'Yes', icon: Plane },
            ],
            highlights: [
                'Tuition-free public universities in Germany',
                'Schengen visa for travel across 26+ countries',
                'Internationally recognized ECTS system',
                'Focus on technical and applied sciences'
            ],
            mainListLabel: 'Top Education Hubs',
            mainList: [
                'Technical University of Munich (Germany)',
                'Sorbonne University (France)',
                'University of Amsterdam (Netherlands)',
                'ETH Zurich (Switzerland)',
                'University of Bologna (Italy)'
            ],
            subListLabel: 'Popular Fields',
            subList: [
                'Automotive Engineering',
                'International Business',
                'Luxury Brand Management',
                'Sustainability Studies',
                'Art & Design'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: '€600 - €1,200 / month' },
                { category: 'Food & Groceries', range: '€250 - €400 / month' },
                { category: 'Transport (Pass)', range: '€30 - €70 / month' },
                { category: 'Total Monthly', range: '€1,000 - €1,800' }
            ],
            visaRequirements: [
                'National Long-Stay Visa (Type D)',
                'Proof of Blocked Account / Funding',
                'Health Insurance Coverage',
                'University Enrollment Confirmation',
                'Language Proficiency Certificate'
            ],
            whyContent: 'Europe provides a multi-dimensional education that goes beyond the classroom, fostering global citizenship and cultural adaptability.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1473951574080-01fe45ec8643?q=80&w=1200&auto=format&fit=crop',
            heroText: 'The Grand Tour of Your Dreams',
            overview: 'From the romantic canals of Venice to the historic ruins of Athens, Europe is the ultimate destination for culture, history, and art.',
            statistics: [
                { label: 'Visa Type', value: 'Schengen Visitor', icon: Plane },
                { label: 'Member States', value: '27 Countries', icon: Globe },
                { label: 'Stay Duration', value: '90 Days / 180', icon: Clock },
                { label: 'Visitors', value: '500M+ / Year', icon: Users },
            ],
            highlights: [
                'World-famous landmarks',
                'Seamless cross-border travel',
                'Rich artistic heritage',
                'Exceptional culinary scenes'
            ],
            mainListLabel: 'Must-Visit Cities',
            mainList: [
                'Paris, France',
                'Rome, Italy',
                'Barcelona, Spain',
                'Prague, Czechia',
                'Venice, Italy'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Museum Hopping',
                'Wine Tasting Tours',
                'Historic Walking Tours',
                'River Cruises',
                'Train Travel (Eurail)'
            ],
            costOfLiving: [
                { category: 'City Centre Hotel', range: '€120 - €250 / night' },
                { category: 'Daily Meals', range: '€40 - €80 / day' },
                { category: 'Transport (Train)', range: '€20 - €50 / day' },
                { category: 'Daily Budget', range: '€180 - €400' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Schengen Insurance',
                'Proof of Subsistence',
                'Return Flight Ticket',
                'Hotel Reservoir'
            ],
            whyContent: 'Europe offers a variety of experiences packed into a single continent, where every border crossing leads to a new culture and story.'
        }
    },
    'new-zealand': {
        id: 'new-zealand',
        country: 'New Zealand',
        flag: 'nz',
        image: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Safe Environment with Top-Ranked Universities',
            overview: 'New Zealand offers a stunning natural environment, a high safety index, and universities that rank in the top 3% globally.',
            statistics: [
                { label: 'Safety', value: 'High Rank', icon: Shield },
                { label: 'Universities', value: '100% Top 3%', icon: Award },
                { label: 'Intake', value: 'Feb/July', icon: Calendar },
                { label: 'PSW', value: 'Up to 3 Years', icon: Clock },
            ],
            highlights: [
                'All universities rank globally',
                'Beautiful landscapes (Lord of the Rings)',
                'Great focus on work-life balance',
                'Warm and welcoming Kiwi culture'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'University of Auckland',
                'University of Otago',
                'Victoria University of Wellington',
                'University of Canterbury',
                'Massey University'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Agricultural Sciences',
                'Environment & Conservation',
                'Marine Studies',
                'Digital Effects',
                'Hospitality Management'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: 'NZD 600 - NZD 1,200 / month' },
                { category: 'Food & Groceries', range: 'NZD 250 - NZD 450 / month' },
                { category: 'Transport', range: 'NZD 60 - NZD 100 / month' },
                { category: 'Total Monthly', range: 'NZD 1,000 - NZD 2,000' }
            ],
            visaRequirements: [
                'Offer of Place',
                'Student Visa Application',
                'Proof of Tuition Fee Payment',
                'Medical \u0026 Chest X-ray',
                'Evidence of Funds'
            ],
            whyContent: 'New Zealand is ideal for students looking for a safe, serene environment that doesn\'t compromise on academic rigor and global recognition.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Journey to the Middle of the Earth',
            overview: 'Explore New Zealand\'s dramatic landscapes, from geothermal wonders in the North to the majestic fjords of the South.',
            statistics: [
                { label: 'Visa Type', value: 'Visitor Visa / NZeTA', icon: Plane },
                { label: 'Stay Duration', value: 'Up to 9 Months', icon: Clock },
                { label: 'Processing', value: '10-25 Days', icon: Calendar },
                { label: 'Visitors', value: '4M / Year', icon: Users },
            ],
            highlights: [
                'Stunning film locations (LotR)',
                'Adventure sports capital',
                'Maori cultural experiences',
                'Pristine natural environment'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'Hobbiton Movie Set',
                'Milford Sound',
                'Rotorua Geothermal Park',
                'Lake Tekapo',
                'Sky Tower, Auckland'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Bungy Jumping in Queenstown',
                'Glacier Hiking (Franz Josef)',
                'Maori Hangi Feast',
                'Whale Watching in Kaikoura',
                'Waitomo Glowworm Caves'
            ],
            costOfLiving: [
                { category: 'Motel/Hotel', range: 'NZD 120 - NZD 250 / night' },
                { category: 'Cafes & Dining', range: 'NZD 40 - NZD 80 / day' },
                { category: 'Rental Car', range: 'NZD 50 - NZD 100 / day' },
                { category: 'Daily Budget', range: 'NZD 200 - NZD 450' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Evidence of Sufficient Funds',
                'Onward/Return Ticket',
                'Good Health Evidence',
                'Genuine Intent to Visit'
            ],
            whyContent: 'New Zealand is the ultimate destination for nature lovers and adventurers, offering landscapes that look like they belong in a fantasy world.'
        }
    },
    ireland: {
        id: 'ireland',
        country: 'Ireland',
        flag: 'ie',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1564959130747-897fb406b9af?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Experience Innovation in the Emerald Isle',
            overview: 'Ireland is a global hub for technology and pharmaceuticals, offering a vibrant, friendly atmosphere and high-quality education at the heart of Europe.',
            statistics: [
                { label: 'Universities', value: '8 Global Rank', icon: GraduationCap },
                { label: 'Work Rights', value: '20 Hrs/Week', icon: Users },
                { label: 'Post-Study Work', value: '1-2 Years', icon: Clock },
                { label: 'Industry Hub', value: 'Top Tech', icon: Award },
            ],
            highlights: [
                'Home to European HQs of Google, Apple, and Facebook',
                'Strong focus on software engineering and biotechnology',
                'English-speaking country in the EU',
                'Rich literary and cultural heritage'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'Trinity College Dublin',
                'University College Dublin',
                'National University of Ireland Galway',
                'University College Cork',
                'Dublin City University'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Data Science & Analytics',
                'Pharmaceutical Sciences',
                'Fintech',
                'Cyber Security',
                'Business Analytics'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: '€800 - €1,500 / month' },
                { category: 'Food & Groceries', range: '€250 - €400 / month' },
                { category: 'Transport', range: '€60 - €100 / month' },
                { category: 'Total Monthly', range: '€1,200 - €2,200' }
            ],
            visaRequirements: [
                'Admission Letter',
                'Study Visa Application',
                'Proof of Financial Funds',
                'English Proficiency (IELTS/PTE)',
                'Medical Insurance'
            ],
            whyContent: 'Ireland offers the perfect mix of high-tech career opportunities and a warm, welcoming community, making it a top choice for ambitious students.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Explore the Enchanting Emerald Isle',
            overview: 'From the dramatic Cliffs of Moher to the lively streets of Dublin, Ireland offers a unique blend of ancient history and warm hospitality.',
            statistics: [
                { label: 'Visa Type', value: 'Short Stay \'C\'', icon: Plane },
                { label: 'Stay Duration', value: 'Up to 90 Days', icon: Clock },
                { label: 'Processing', value: '10-20 Days', icon: Calendar },
                { label: 'Visitors', value: '11M / Year', icon: Users },
            ],
            highlights: [
                'Breathtaking coastal scenery',
                'Famous pub culture and music',
                'Historic castles and ruins',
                'Friendly, welcoming locals'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'Cliffs of Moher',
                'Trinity College (Book of Kells)',
                'Ring of Kerry',
                'Guinness Storehouse, Dublin',
                'Giant\'s Causeway (Northern Ireland)'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Traditional Music Sessions',
                'Guinness Tasting',
                'Castle Tours',
                'Coastal Cliff Walks',
                'Literary Pub Crawls'
            ],
            costOfLiving: [
                { category: 'City Hotel', range: '€120 - €250 / night' },
                { category: 'Dining & Drinks', range: '€40 - €80 / day' },
                { category: 'Local Transport', range: '€10 - €25 / day' },
                { category: 'Daily Budget', range: '€180 - €400' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Application Summary Sheet',
                'Financial Evidence',
                'Reason for Visit Proof',
                'Evidence of Ties to Home'
            ],
            whyContent: 'Ireland is a land of legends and landscapes that will leave you breathless, offering a truly authentic and heartwarming travel experience.'
        }
    },
    singapore: {
        id: 'singapore',
        country: 'Singapore',
        flag: 'sg',
        image: 'https://images.unsplash.com/photo-1525596662741-e94ff9f26de1?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Global Business Hub in the Heart of Asia',
            overview: 'Singapore is a world leader in education and innovation, providing a safe, multicultural environment with direct access to the Asian growing markets.',
            statistics: [
                { label: 'World Ranking', value: 'Top 15', icon: Award },
                { label: 'Safety Index', value: 'World #1', icon: Shield },
                { label: 'Innovation', value: 'Global Leader', icon: TrendingUp },
                { label: 'Multicultural', value: 'Yes', icon: Globe },
            ],
            highlights: [
                'World-class universities (NUS, NTU)',
                'Global financial and technology center',
                'Extremely safe and clean environment',
                'Strategic location for career growth in Asia'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'National University of Singapore (NUS)',
                'Nanyang Technological University (NTU)',
                'Singapore Management University (SMU)',
                'Singapore University of Technology and Design',
                'JCU Singapore'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Global Business Management',
                'Artificial Intelligence',
                'Logistics & Supply Chain',
                'Hospitality Management',
                'Finance'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: 'SGD 800 - SGD 2,000 / month' },
                { category: 'Food & Groceries', range: 'SGD 400 - SGD 600 / month' },
                { category: 'Transport', range: 'SGD 100 - SGD 150 / month' },
                { category: 'Total Monthly', range: 'SGD 1,500 - SGD 3,000' }
            ],
            visaRequirements: [
                'In-Principle Approval (IPA) Letter',
                'Student\'s Pass Application',
                'Financial Capacity Proof',
                'Medical Examination',
                'English Proficiency'
            ],
            whyContent: 'Singapore provides an education that is internationally recognized and deeply connected to global industry networks, especially in business and tech.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1525596662741-e94ff9f26de1?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Experience the Future in the Garden City',
            overview: 'Singapore is a melting pot of cultures, offering futuristic architecture, world-class dining, and lush tropical gardens in a compact, efficient city-state.',
            statistics: [
                { label: 'Visa Type', value: 'Short Term Visit Pass', icon: Plane },
                { label: 'Stay Duration', value: 'Up to 30 Days', icon: Clock },
                { label: 'Processing', value: '3-10 Days', icon: Calendar },
                { label: 'Visitors', value: '19M / Year', icon: Users },
            ],
            highlights: [
                'Iconic Marina Bay Sands skyline',
                'Award-winning street food (Hawker Centres)',
                'Futuristic Gardens by the Bay',
                'Universal Studios & Sentosa Island'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'Gardens by the Bay',
                'Marina Bay Sands Skypark',
                'Sentosa Island',
                'Singapore Zoo & Night Safari',
                'Chinatown & Little India'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Night Safari Adventure',
                'Hawker Centre Food Tour',
                'Shopping on Orchard Road',
                'River Cruise at Clarke Quay',
                'Cable Car to Sentosa'
            ],
            costOfLiving: [
                { category: 'Upscale Hotel', range: 'SGD 250 - SGD 500 / night' },
                { category: 'Dining & Drinks', range: 'SGD 50 - SGD 120 / day' },
                { category: 'MRT (Train)', range: 'SGD 5 - SGD 15 / day' },
                { category: 'Daily Budget', range: 'SGD 200 - SGD 600' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Confirmed Onward Ticket',
                'Sufficient Funds Proof',
                'SG Arrival Card (SGAC)',
                'Yellow Fever Cert (if applicable)'
            ],
            whyContent: 'Singapore is a city that never ceases to amaze, where tradition meets the future in a seamless, vibrant, and incredibly safe environment.'
        }
    },
    germany: {
        id: 'germany',
        country: 'Germany',
        flag: 'de',
        image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?q=80&w=1200&auto=format&fit=crop',
            heroText: 'The Land of Technical Excellence',
            overview: 'Germany is a premier destination for engineering and research, offering low or no tuition fees at public universities and a strong economy with job opportunities.',
            statistics: [
                { label: 'Tuition', value: '€0 (Public)', icon: Award },
                { label: 'Work rights', value: '18 Months PSW', icon: Clock },
                { label: 'Industry', value: 'Engineering Hub', icon: TrendingUp },
                { label: 'Intl. Students', value: '400k+', icon: Users },
            ],
            highlights: [
                'No tuition fees in most state universities',
                'World-renowned focus on STEM and Engineering',
                'Rich history and high quality of life',
                'Opportunity to learn German for career edge'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'Technical University of Munich',
                'Heidelberg University',
                'Ludwig Maximilian University of Munich',
                'RWTH Aachen University',
                'Humboldt University of Berlin'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Mechanical Engineering',
                'Automotive Technology',
                'Computer Science',
                'Sustainability Studies',
                'Physics'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: '€400 - €900 / month' },
                { category: 'Food & Groceries', range: '€200 - €300 / month' },
                { category: 'Transport', range: '€50 - €80 / month' },
                { category: 'Total Monthly', range: '€800 - €1,200' }
            ],
            visaRequirements: [
                'Blocked Account (Sperrkonto)',
                'Admission Letter',
                'National Student Visa',
                'Health Insurance',
                'Language Proficiency (English/German)'
            ],
            whyContent: 'Germany offers world-class education with almost zero tuition, making it the most cost-effective path to a high-end career in engineering and research.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?q=80&w=1200&auto=format&fit=crop',
            heroText: 'The Heart of Old World Europe',
            overview: 'Discover Germany\'s fairytale castles, historic cities, and world-famous festivals, from the Bavarian Alps to the Berlin Wall.',
            statistics: [
                { label: 'Visa Type', value: 'Schengen Visitor', icon: Plane },
                { label: 'Stay Duration', value: '90 Days / 180', icon: Clock },
                { label: 'Processing', value: '15 Working Days', icon: Calendar },
                { label: 'Visitors', value: '38M / Year', icon: Users },
            ],
            highlights: [
                'Fairytale castles (Neuschwanstein)',
                'Vibrant Berlin nightlife',
                'Scenic Rhine River cruises',
                'Quaint medieval villages'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'Brandenburg Gate, Berlin',
                'Neuschwanstein Castle, Bavaria',
                'Cologne Cathedral',
                'The Black Forest',
                'Miniatur Wunderland, Hamburg'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Oktoberfest in Munich',
                'Christmas Market Tours',
                'Driving on the Autobahn',
                'Beer Garden Evenings',
                'Historical Wall Tours'
            ],
            costOfLiving: [
                { category: 'Typical Hotel', range: '€100 - €220 / night' },
                { category: 'Meals & Beer', range: '€30 - €60 / day' },
                { category: 'Local Transport', range: '€10 - €20 / day' },
                { category: 'Daily Budget', range: '€140 - €300' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Schengen Travel Insurance',
                'Proof of Financial Means',
                'Round-trip Reservation',
                'Hotel Booking Proof'
            ],
            whyContent: 'Germany is a country of deep traditions and modern wonders, offering a travel experience that is as educational as it is enjoyable.'
        }
    },
    france: {
        id: 'france',
        country: 'France',
        flag: 'fr',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Where Tradition Meets Modern Innovation',
            overview: 'France is known for its legendary "Grandes Écoles", rich cultural heritage, and world-leading expertise in fashion, luxury, and aerospace.',
            statistics: [
                { label: 'Ranking', value: 'Top World Rank', icon: Award },
                { label: 'Style', value: 'Cultural Hub', icon: Globe },
                { label: 'Work Perm.', value: '1-2 Years', icon: Clock },
                { label: 'Subsidies', value: 'Available', icon: TrendingUp },
            ],
            highlights: [
                'World-leading Business Schools',
                'Rich culinary and artistic environment',
                'Government-subsidized accommodation (CAF)',
                'Access to the entire Schengen region'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'Sorbonne University',
                'HEC Paris',
                'École Polytechnique',
                'Sciences Po',
                'Université PSL'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Luxury Brand Management',
                'Fashion & Design',
                'Aerospace Engineering',
                'Culinary Arts',
                'International Relations'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: '€500 - €1,200 / month' },
                { category: 'Food & Groceries', range: '€250 - €400 / month' },
                { category: 'Transport', range: '€50 - €100 / month' },
                { category: 'Total Monthly', range: '€900 - €1,800' }
            ],
            visaRequirements: [
                'Campus France Interview',
                'Admission Letter',
                'Proof of Financial Means',
                'Long-stay Visa (VLS-TS)',
                'Civil Liability Insurance'
            ],
            whyContent: 'France combines academic excellence with a unique lifestyle, providing specialized high-end training in some of the world\'s most prestigious industries.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop',
            heroText: 'The Art of Living (Art de Vivre)',
            overview: 'France is the world\'s most visited country, offering everything from the romantic streets of Paris to the sun-soaked beaches of the Riviera.',
            statistics: [
                { label: 'Visa Type', value: 'Schengen Visitor', icon: Plane },
                { label: 'Stay Duration', value: '90 Days / 180', icon: Clock },
                { label: 'Processing', value: '15-20 Days', icon: Calendar },
                { label: 'Visitors', value: '89M / Year', icon: Users },
            ],
            highlights: [
                'World-famous museums (Louvre)',
                'Exquisite wine regions (Bordeaux)',
                'Iconic Eiffel Tower views',
                'Mediterranean lifestyle (Riviera)'
            ],
            mainListLabel: 'Must-Visit Regions',
            mainList: [
                'Paris & Île-de-France',
                'Provence & French Riviera',
                'The Loire Valley',
                'Normandy (D-Day Beaches)',
                'Bordeaux & Wine Country'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Museum Expeditions',
                'Wine Tasting Tours',
                'Palace of Versailles Visit',
                'Southern Beach Relaxation',
                'Gourmet Gastronomy'
            ],
            costOfLiving: [
                { category: 'Boutique Hotel', range: '€180 - €350 / night' },
                { category: 'Fine Dining', range: '€60 - €120 / day' },
                { category: 'Metro/Train', range: '€10 - €30 / day' },
                { category: 'Daily Budget', range: '€250 - €500' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Schengen Medical Insurance',
                'Sufficient Funds Proof',
                'Proof of Accommodation',
                'Return Flight Ticket'
            ],
            whyContent: 'France is a sensory journey that combines history, art, and gastronomy in a way that remains unmatched anywhere else in the world.'
        }
    },
    uae: {
        id: 'uae',
        country: 'UAE (Dubai)',
        flag: 'ae',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1574950578143-858c6fc58922?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Study in the City of the Future',
            overview: 'The UAE, especially Dubai, offers a futuristic learning experience with branch campuses of top international universities in a tax-free, cosmopolitan environment.',
            statistics: [
                { label: 'Tax-Free', value: '100% Tax-Free', icon: Award },
                { label: 'Growth', value: 'Fastest Growing', icon: TrendingUp },
                { label: 'Visa', value: 'Easy Processing', icon: Plane },
                { label: 'Diversity', value: '200+ Nationalities', icon: Users },
            ],
            highlights: [
                'Global hub for tourism and logistics',
                'Inter-campus transfers available',
                'Modern infrastructure and luxury lifestyle',
                'Safe and politically stable environment'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'Zayed University',
                'University of Wollongong Dubai',
                'Middlesex University Dubai',
                'Heriot-Watt University Dubai',
                'American University in Dubai'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Hospitality & Tourism',
                'International Business',
                'Architecture',
                'Digital Marketing',
                'Finance'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: 'AED 3,000 - AED 6,000 / month' },
                { category: 'Food & Groceries', range: 'AED 1,000 - AED 2,000 / month' },
                { category: 'Transport', range: 'AED 300 - AED 600 / month' },
                { category: 'Total Monthly', range: 'AED 5,000 - AED 10,000' }
            ],
            visaRequirements: [
                'University Sponsorship',
                'Medical Fitness Certificate',
                'Emirates ID Registration',
                'Proof of Tuition Payment',
                'Student Visa Application'
            ],
            whyContent: 'Dubai offers a unique opportunity to study in a rapidly growing international business hub with world-class facilities and a vibrant expatriate community.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Experience Luxury and Innovation',
            overview: 'The UAE is a desert miracle, offering world-record landmarks, incredible shopping experiences, and a blend of traditional culture and ultra-modern luxury.',
            statistics: [
                { label: 'Visa Type', value: 'Tourist Visa', icon: Plane },
                { label: 'Stay Duration', value: '30 or 60 Days', icon: Clock },
                { label: 'Processing', value: '24-72 Hours', icon: Calendar },
                { label: 'Visitors', value: '16M / Year', icon: Users },
            ],
            highlights: [
                'Tallest building (Burj Khalifa)',
                'World-class desert safaris',
                'Luxurious beach resorts',
                'Largest shopping malls'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'Burj Khalifa & Dubai Mall',
                'Sheikh Zayed Grand Mosque',
                'Palm Jumeirah',
                'Museum of the Future',
                'Expo City Dubai'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Desert Dune Bashing',
                'Skiing at Ski Dubai',
                'Luxury Yacht Tours',
                'Gold & Spice Souk',
                'Skydiving over Palm'
            ],
            costOfLiving: [
                { category: 'Luxury Hotel', range: 'AED 600 - AED 1,500 / night' },
                { category: 'Dining & Drinks', range: 'AED 150 - AED 400 / day' },
                { category: 'Taxi / Metro', range: 'AED 40 - AED 100 / day' },
                { category: 'Daily Budget', range: 'AED 800 - AED 2,000' }
            ],
            visaRequirements: [
                'Valid Passport (6 months)',
                'Passport Size Photo',
                'Confirmed Flight Ticket',
                'Proof of Funds (for some)',
                'Medical Insurance'
            ],
            whyContent: 'The UAE is where the impossible becomes reality, offering an experience of grandeur and innovation that is truly one of a kind.'
        }
    },
    switzerland: {
        id: 'switzerland',
        country: 'Switzerland',
        flag: 'ch',
        image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Precision and Excellence in Education',
            overview: 'Switzerland is the undisputed leader in hospitality and banking education, set against the backdrop of the breathtaking Swiss Alps.',
            statistics: [
                { label: 'QS Ranking', value: 'Top World Tier', icon: Award },
                { label: 'Hospitality', value: 'World #1', icon: GraduationCap },
                { label: 'Economy', value: 'Stable & Robust', icon: TrendingUp },
                { label: 'Nature', value: 'Clean & Green', icon: Globe },
            ],
            highlights: [
                'World\'s best hospitality management schools',
                'Global center for banking and finance',
                'Very high safety and quality of life',
                'Multilingual environment (German, French, Italian)'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'ETH Zurich',
                'EPFL',
                'EHL Hospitality Business School',
                'University of Zurich',
                'University of Geneva'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Hospitality Management',
                'Banking & Finance',
                'Data Science',
                'Environmental Sciences',
                'Precision Engineering'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: 'CHF 1,000 - CHF 2,000 / month' },
                { category: 'Food & Groceries', range: 'CHF 400 - CHF 600 / month' },
                { category: 'Transport', range: 'CHF 80 - CHF 150 / month' },
                { category: 'Total Monthly', range: 'CHF 2,000 - CHF 3,500' }
            ],
            visaRequirements: [
                'Proof of Financial Solvency',
                'Admission Certificate',
                'Study Plan Agreement',
                'Health Insurance (Swiss compliant)',
                'National Visa D'
            ],
            whyContent: 'Switzerland offers a prestigious education that is synonymous with quality, precision, and global leadership in finance and hospitality.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop',
            heroText: 'The Roof of Europe',
            overview: 'Switzerland is a winter wonderland and a summer paradise, offering world-class skiing, pristine lakes, and the most efficient train network in the world.',
            statistics: [
                { label: 'Visa Type', value: 'Schengen Visitor', icon: Plane },
                { label: 'Stay Duration', value: '90 Days / 180', icon: Clock },
                { label: 'Processing', value: '10-15 Days', icon: Calendar },
                { label: 'Visitors', value: '12M / Year', icon: Users },
            ],
            highlights: [
                'Majestic Alpine scenery',
                'Interlaken adventure hub',
                'Swiss chocolate & cheese',
                'Scenic train journeys'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'The Matterhorn, Zermatt',
                'Jungfraujoch (Top of Europe)',
                'Lake Geneva',
                'Lucerne Old Town',
                'Rhine Falls, Schaffhausen'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Alpine Skiing & Snowboarding',
                'Glacier Express Train Ride',
                'Chocolate Workshop in Zurich',
                'Hiking in the Lauterbrunnen',
                'Boat Tour on Lake Brienz'
            ],
            costOfLiving: [
                { category: 'Alpine Lodge', range: 'CHF 200 - CHF 450 / night' },
                { category: 'Dining & Chocolate', range: 'CHF 60 - CHF 120 / day' },
                { category: 'Swiss Travel Pass', range: 'CHF 30 - CHF 60 / day' },
                { category: 'Daily Budget', range: 'CHF 300 - CHF 650' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Financial Sufficiency Proof',
                'Schengen Health Insurance',
                'Travel Itinerary',
                'Proof of Return Intent'
            ],
            whyContent: 'Switzerland is a destination that feels like a postcard, where every turn reveals a more beautiful landscape than the last.'
        }
    },
    netherlands: {
        id: 'netherlands',
        country: 'Netherlands',
        flag: 'nl',
        image: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Interactive Learning in a Global Hub',
            overview: 'The Netherlands offers a vast number of English-taught programs and an innovative teaching style focused on problem-solving and collaboration.',
            statistics: [
                { label: 'English Pgms', value: '2000+', icon: BookOpen },
                { label: 'PSW', value: 'Orientation Year', icon: Clock },
                { label: 'Innovation', value: 'Top Global', icon: TrendingUp },
                { label: 'Transport', value: 'Bicycle Friendly', icon: MapPin },
            ],
            highlights: [
                'Interactive, student-led teaching style',
                'Highly international classroom environment',
                'Excellent post-study work routes (Orientation Year)',
                'Hub for international business and trade'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'University of Amsterdam',
                'Delft University of Technology',
                'Wageningen University',
                'Utrecht University',
                'Leiden University'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Environmental Studies',
                'Urban Planning',
                'Artificial Intelligence',
                'Psychology',
                'Water Management'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: '€600 - €1,200 / month' },
                { category: 'Food & Groceries', range: '€200 - €350 / month' },
                { category: 'Transport', range: '€50 - €100 / month' },
                { category: 'Total Monthly', range: '€900 - €1,700' }
            ],
            visaRequirements: [
                'MVV (Provisional Residence Permit)',
                'University-led Application',
                'Financial Maintenance Proof',
                'Admission Letter',
                'Background Check'
            ],
            whyContent: 'The Netherlands is perfect for students seeking a progressive, English-speaking environment with a strong focus on practical, collaborative learning.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Canals, Culture, and Color',
            overview: 'From the iconic canals of Amsterdam to the vast tulip fields of Keukenhof, the Netherlands is a country that celebrates art, heritage, and modern sustainability.',
            statistics: [
                { label: 'Visa Type', value: 'Schengen Visitor', icon: Plane },
                { label: 'Stay Duration', value: '90 Days / 180', icon: Clock },
                { label: 'Processing', value: '15 Working Days', icon: Calendar },
                { label: 'Visitors', value: '20M / Year', icon: Users },
            ],
            highlights: [
                'Unique canal-laced cities',
                'World-famous art museums',
                'Vast blooming tulip fields',
                'Historical wooden windmills'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'Amsterdam Canal District',
                'Keukenhof Gardens (Lisse)',
                'Anne Frank House, Amsterdam',
                'Van Gogh Museum',
                'Kinderdijk Windmills'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Canal Boat Cruises',
                'Cycling Tours through Cities',
                'Museum Hopping',
                'Cheese Tasting in Gouda',
                'Visiting the Delta Works'
            ],
            costOfLiving: [
                { category: 'Canal Hotel', range: '€150 - €300 / night' },
                { category: 'Dining & Drinks', range: '€40 - €80 / day' },
                { category: 'Bike Rental / Tram', range: '€10 - €20 / day' },
                { category: 'Daily Budget', range: '€200 - €450' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Proof of Subsistence',
                'Travel Medical Insurance',
                'Round-trip Ticket',
                'Hotel Confirmation'
            ],
            whyContent: 'The Netherlands is a country of vibrant colors and open-minded people, where every city feels like a living museum of art and history.'
        }
    },
    malaysia: {
        id: 'malaysia',
        country: 'Malaysia',
        flag: 'my',
        image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Quality Education with Tropical Vibrance',
            overview: 'Malaysia has emerged as a top educational hub in Southeast Asia, offering affordable high-quality education and branch campuses of prestigious UK and AU universities.',
            statistics: [
                { label: 'Cost', value: 'Very Affordable', icon: TrendingUp },
                { label: 'Branch Campuses', value: 'Top UK/AU', icon: GraduationCap },
                { label: 'Food', value: 'Global Cuisines', icon: Globe },
                { label: 'Weather', value: 'Tropical', icon: Calendar },
            ],
            highlights: [
                'High quality of life at a low cost',
                'Diverse, multicultural and friendly society',
                'Strong in twinning programs and branch campuses',
                'Excellent regional travel opportunities'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'University of Malaya (UM)',
                'Universiti Putra Malaysia (UPM)',
                'Taylor’s University',
                'UCSI University',
                'Monash University Malaysia'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Computer Science',
                'Business & Commerce',
                'Communication & Media',
                'Education',
                'Engineering'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: 'RM 1,000 - RM 2,500 / month' },
                { category: 'Food & Groceries', range: 'RM 600 - RM 1,200 / month' },
                { category: 'Transport', range: 'RM 150 - RM 300 / month' },
                { category: 'Total Monthly', range: 'RM 2,000 - RM 4,500' }
            ],
            visaRequirements: [
                'eVAL (Electronic Visa Approval Letter)',
                'Student Pass Application',
                'Admission Offer',
                'Medical Screening',
                'Proof of Financial Support'
            ],
            whyContent: 'Malaysia offers an incredible value-for-money education with a global perspective, set in one of the most culturally diverse and beautiful countries in Asia.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1596422846543-b5c645842269?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Truly Asia Experience',
            overview: 'Malaysia is a land of stunning contrasts, where towering skyscrapers overlook ancient rainforests and diverse cultures live in harmony.',
            statistics: [
                { label: 'Visa Type', value: 'Social Visit Pass', icon: Plane },
                { label: 'Stay Duration', value: 'Up to 90 Days', icon: Clock },
                { label: 'Processing', value: '2-5 Working Days', icon: Calendar },
                { label: 'Visitors', value: '26M / Year', icon: Users },
            ],
            highlights: [
                'Breathtaking Petronas Towers',
                'Ancient rainforests (Taman Negara)',
                'World-famous street food (Penang)',
                'Stunning island beaches'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'Kuala Lumpur City Centre',
                'Batu Caves, Selangor',
                'Langkawi Archipelago',
                'George Town, Penang',
                'Mount Kinabalu, Borneo'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Skybridge Walk (KL)',
                'Snorkeling in Perhentian',
                'Tea Plantation Tour (Cameron)',
                'Food Trail in Penang',
                'Wildlife River Cruise (Sabah)'
            ],
            costOfLiving: [
                { category: 'Luxury Resort', range: 'RM 400 - RM 900 / night' },
                { category: 'Street Food Feast', range: 'RM 30 - RM 60 / day' },
                { category: 'E-hailing / LRT', range: 'RM 20 - RM 50 / day' },
                { category: 'Daily Budget', range: 'RM 250 - RM 600' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Malaysia Digital Arrival Card',
                'Confirmed Return Ticket',
                'Proof of Sufficient Funds',
                'Accommodation Booking'
            ],
            whyContent: 'Malaysia truly captures the essence of Asia, offering a rich tapestry of experiences that are both accessible and deeply rewarding.'
        }
    },
    italy: {
        id: 'italy',
        country: 'Italy',
        flag: 'it',
        image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Inherit the Legacy of Art and Innovation',
            overview: 'Italy is a world leader in arts, design, and architecture, offering top-tier education in historically rich cities that are global centers of creativity.',
            statistics: [
                { label: 'UNESCO Sites', value: '#1 Globally', icon: Globe },
                { label: 'Design Excellence', value: 'World Class', icon: Award },
                { label: 'Intake', value: 'Sept/Oct', icon: Calendar },
                { label: 'Study Life', icon: Users, value: 'Vibrant' },
            ],
            highlights: [
                'Birthplace of the Renaissance and modern design',
                'Home to Europe\'s oldest universities',
                'Affordable tuition fees compared to Anglo-Saxon countries',
                'Excellence in automotive, fashion, and culinary arts'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'Politecnico di Milano',
                'University of Bologna',
                'Sapienza University of Rome',
                'University of Padua',
                'University of Milan'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Architecture & Design',
                'Fashion Management',
                'Fine Arts',
                'Civil Engineering',
                'Humanities & History'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: '€400 - €800 / month' },
                { category: 'Food & Groceries', range: '€200 - €300 / month' },
                { category: 'Transport', range: '€30 - €60 / month' },
                { category: 'Total Monthly', range: '€700 - €1,200' }
            ],
            visaRequirements: [
                'Entry Visa D for Study',
                'Proof of Financial Means',
                'Valid Passport',
                'Admission Guarantee',
                'Health Insurance Coverage'
            ],
            whyContent: 'Italy provides a unique opportunity to study at the intersection of history and modern innovation, particularly for students in creative and engineering fields.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1529154691717-3306083d869e?q=80&w=1200&auto=format&fit=crop',
            heroText: 'The Bel Paese (Beautiful Country)',
            overview: 'Italy is a masterpiece of culture and landscape, from the rolling hills of Tuscany and the ancient ruins of Rome to the glittering Amalfi Coast.',
            statistics: [
                { label: 'Visa Type', value: 'Schengen Visitor', icon: Plane },
                { label: 'Stay Duration', value: '90 Days / 180', icon: Clock },
                { label: 'Processing', value: '15 Working Days', icon: Calendar },
                { label: 'Visitors', value: '65M / Year', icon: Users },
            ],
            highlights: [
                'Unrivaled historical heritage',
                'World-famous culinary scene',
                'Stunning Mediterranean coasts',
                'Exquisite fashion and shopping'
            ],
            mainListLabel: 'Must-Visit Cities',
            mainList: [
                'Rome (The Eternal City)',
                'Florence (Cradle of Renaissance)',
                'Venice (The Floating City)',
                'Milan (Fashion Capital)',
                'Naples & Amalfi Coast'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Colosseum & Forum Tour',
                'Uffizi Gallery Exploration',
                'Gondola Ride in Venice',
                'Tuscan Wine Tasting',
                'Coastal Drive on Amalfi'
            ],
            costOfLiving: [
                { category: 'Charming Hotel', range: '€140 - €280 / night' },
                { category: 'Pasta & Wine', range: '€40 - €80 / day' },
                { category: 'Train / Vaporetto', range: '€15 - €40 / day' },
                { category: 'Daily Budget', range: '€200 - €450' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Travel Health Insurance',
                'Proof of Accommodation',
                'Round-trip Travel Proof',
                'Financial Sufficiency Proof'
            ],
            whyContent: 'Italy is not just a destination; it\'s a way of life that celebrates beauty, flavor, and history in every single moment.'
        }
    },
    spain: {
        id: 'spain',
        country: 'Spain',
        flag: 'es',
        image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Academic Excellence Under the Mediterranean Sun',
            overview: 'Spain offers a high standard of living, world-renowned business schools, and the chance to master the second most spoken language in the world.',
            statistics: [
                { label: 'Business Rank', value: 'Top Global', icon: TrendingUp },
                { label: 'Language', value: 'Global Reach', icon: Globe },
                { label: 'Student Cities', value: 'Top Rated', icon: MapPin },
                { label: 'Cost of Life', value: 'Affordable', icon: Award },
            ],
            highlights: [
                'World-leading business schools (IE, IESE, ESADE)',
                'Rich cultural diversity and historical sites',
                'Mastering Spanish provides global career options',
                'Great climate and vibrant social life'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'University of Barcelona',
                'Autonomous University of Madrid',
                'Complutense University of Madrid',
                'Pompeu Fabra University',
                'University of Navarra'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'MBA & Business Admin',
                'Tourism & Hospitality',
                'Arts & Humanities',
                'Social Sciences',
                'Renewable Energy'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: '€500 - €1,000 / month' },
                { category: 'Food & Groceries', range: '€200 - €350 / month' },
                { category: 'Transport', range: '€40 - €70 / month' },
                { category: 'Total Monthly', range: '€800 - €1,500' }
            ],
            visaRequirements: [
                'Offer of Admission',
                'Spanish Student Visa',
                'Medical Clearance',
                'Criminal Background Check',
                'Proof of Financial Support'
            ],
            whyContent: 'Spain combines high-quality academic training with a fantastic lifestyle, offering students a well-rounded and globally relevant educational experience.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Fiesta, Siesta, and History',
            overview: 'Spain is a vibrant tapestry of passion, from the architectural wonders of Gaudi in Barcelona to the soulful rhythm of Flamenco in Seville.',
            statistics: [
                { label: 'Visa Type', value: 'Schengen Visitor', icon: Plane },
                { label: 'Stay Duration', value: '90 Days / 180', icon: Clock },
                { label: 'Processing', value: '15 Working Days', icon: Calendar },
                { label: 'Visitors', value: '83M / Year', icon: Users },
            ],
            highlights: [
                'Unique Moorish architecture',
                'World-class Mediterranean beaches',
                'Vibrant festival culture',
                'Legendary culinary heritage'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'Sagrada Família, Barcelona',
                'Alhambra Palace, Granada',
                'Prado Museum, Madrid',
                'The Great Mosque of Córdoba',
                'Ibiza & Balearic Islands'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Tapas Crawl in San Sebastián',
                'Flamenco Show in Seville',
                'Architectural Walk in Barcelona',
                'Beach Life in Costa del Sol',
                'Madrid Royal Palace Visit'
            ],
            costOfLiving: [
                { category: 'Plaza Hotel', range: '€130 - €260 / night' },
                { category: 'Tapas & Drinks', range: '€35 - €70 / day' },
                { category: 'Metro / Bus', range: '€5 - €15 / day' },
                { category: 'Daily Budget', range: '€180 - €400' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Schengen Travel Insurance',
                'Proof of Accommodation',
                'Flight Reservations',
                'Economic Solvency Proof'
            ],
            whyContent: 'Spain is a country that teaches you to live life to the fullest, where every plaza and street has a story to tell.'
        }
    },
    japan: {
        id: 'japan',
        country: 'Japan',
        flag: 'jp',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Tradition Meets Cutting-Edge Technology',
            overview: 'Japan is a global leader in technology and robotics, offering a safe, disciplined environment with a unique culture and top-tier research facilities.',
            statistics: [
                { label: 'Technology', value: 'Global Lead', icon: TrendingUp },
                { label: 'Safety', value: 'World Class', icon: Shield },
                { label: 'Universities', value: 'Top Ranked', icon: Award },
                { label: 'Research', value: 'World Leader', icon: GraduationCap },
            ],
            highlights: [
                'Leader in innovation, robotics, and electronics',
                'Safe, clean, and highly organized environment',
                'Generous scholarship programs (MEXT)',
                'Unique blend of ultra-modern and ancient culture'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'University of Tokyo',
                'Kyoto University',
                'Tokyo Institute of Technology',
                'Osaka University',
                'Tohoku University'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Robotics & Automation',
                'Information Technology',
                'Japanese Language & Culture',
                'Mechanical Engineering',
                'Bio-materials'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: '¥50,000 - ¥100,000 / month' },
                { category: 'Food & Groceries', range: '¥30,000 - ¥50,000 / month' },
                { category: 'Transport', range: '¥5,000 - ¥10,000 / month' },
                { category: 'Total Monthly', range: '¥100,000 - ¥180,000' }
            ],
            visaRequirements: [
                'Certificate of Eligibility (COE)',
                'Student Visa Application',
                'Admission Letter',
                'Proof of Financial Ability',
                'Educational Background Documents'
            ],
            whyContent: 'Japan offers a high-tech education that is highly respected worldwide, in a country that values discipline, precision, and deep cultural roots.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=1200&auto=format&fit=crop',
            heroText: 'The Land of the Rising Sun',
            overview: 'Japan is a world apart, where serene temples and traditional tea houses sit alongside neon-lit skyscrapers and bullet trains.',
            statistics: [
                { label: 'Visa Type', value: 'Temporary Visitor', icon: Plane },
                { label: 'Stay Duration', value: 'Up to 90 Days', icon: Clock },
                { label: 'Processing', value: '5-7 Working Days', icon: Calendar },
                { label: 'Visitors', value: '31M / Year', icon: Users },
            ],
            highlights: [
                'Unique cultural experiences',
                'Incredible culinary variety',
                'Efficient bullet train (Shinkansen)',
                'Serene natural beauty'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'Mount Fuji',
                'Kyoto Temples & Gardens',
                'Tokyo Shibuya Crossing',
                'Itsukushima Shrine (Miyajima)',
                'Osaka Dotonbori District'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Traditional Tea Ceremony',
                'Cherry Blossom Viewing',
                'Soaking in an Onsen',
                'Riding the Shinkansen',
                'Ghibli Museum Visit'
            ],
            costOfLiving: [
                { category: 'Modern Hotel', range: '¥15,000 - ¥30,000 / night' },
                { category: 'Authentic Dining', range: '¥5,000 - ¥10,000 / day' },
                { category: 'JR Pass / Metro', range: '¥1,500 - ¥3,500 / day' },
                { category: 'Daily Budget', range: '¥22,000 - ¥45,000' }
            ],
            visaRequirements: [
                'Valid Passport',
                'Visa Application Form',
                'Photograph',
                'Itinerary in Japan',
                'Proof of Financial Power'
            ],
            whyContent: 'Japan is a destination that feels like stepping into the future while being deeply rooted in the past, offering an experience like no other.'
        }
    },
    'south-korea': {
        id: 'south-korea',
        country: 'South Korea',
        flag: 'kr',
        image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop',
        study: {
            image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Ride the Wave of Tech and Culture',
            overview: 'South Korea is at the forefront of the global cultural wave and technological advancement, offering a dynamic environment for study and growth.',
            statistics: [
                { label: 'Smart Tech', value: 'Top Ranked', icon: TrendingUp },
                { label: 'Digital Life', value: 'World Leading', icon: Globe },
                { label: 'Education Rank', value: 'Global Leader', icon: Award },
                { label: 'Culture Hub', value: 'Global Wave', icon: Users },
            ],
            highlights: [
                'Home to global giants like Samsung, LG, and Hyundai',
                'Rapidly growing influence of K-Culture (Music, Film, Tech)',
                'Highly competitive and prestigious education system',
                'Great balance of dynamic cities and natural beauty'
            ],
            mainListLabel: 'Top Universities',
            mainList: [
                'Seoul National University',
                'KAIST',
                'Yonsei University',
                'Korea University',
                'Sungkyunkwangan University'
            ],
            subListLabel: 'Popular Courses',
            subList: [
                'Digital Media & Entertainment',
                'Semiconductor Tech',
                'Global Business',
                'Computer Science',
                'Korean Language Studies'
            ],
            costOfLiving: [
                { category: 'Accommodation', range: '₩400,000 - ₩800,000 / month' },
                { category: 'Food & Groceries', range: '₩300,000 - ₩500,000 / month' },
                { category: 'Transport', range: '₩50,000 - ₩100,000 / month' },
                { category: 'Total Monthly', range: '₩800,000 - ₩1,500,000' }
            ],
            visaRequirements: [
                'Certificate of Admission',
                'Study Visa (D-2)',
                'Bank Statement of Support',
                'Educational Credentials',
                'Medical Clearance'
            ],
            whyContent: 'South Korea is the ideal destination for students who want to be part of a fast-paced, tech-savvy culture that is currently shaping global trends.'
        },
        visit: {
            image: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?q=80&w=1200&auto=format&fit=crop',
            heroText: 'Discover the Dynamic Soul of Asia',
            overview: 'South Korea is a brilliant blend of ancient palaces, neon-drenched cities, and stunning mountains, all powered by a unique creative energy.',
            statistics: [
                { label: 'Visa Type', value: 'Short Term Visitor', icon: Plane },
                { label: 'Stay Duration', value: 'Up to 90 Days', icon: Clock },
                { label: 'Processing', value: '5-10 Working Days', icon: Calendar },
                { label: 'Visitors', value: '17M / Year', icon: Users },
            ],
            highlights: [
                'Vibrant K-Culture and Media',
                'Exquisite traditional cuisine',
                'Stunning ultra-modern cities',
                'Beautiful coastal landscapes'
            ],
            mainListLabel: 'Must-Visit Attractions',
            mainList: [
                'Gyeongbokgung Palace, Seoul',
                'N Seoul Tower',
                'Jeju Island',
                'Bukchon Hanok Village',
                'Haeundae Beach, Busan'
            ],
            subListLabel: 'Top Activities',
            subList: [
                'Street Food Hopping in Myeongdong',
                'Hiking in Bukhansan National Park',
                'Traditional Hanbok Dressing',
                'Visit to the DMZ',
                'Night View Cruise in Busan'
            ],
            costOfLiving: [
                { category: 'Chic Boutique Hotel', range: '₩120,000 - ₩220,000 / night' },
                { category: 'Korean BBQ & Drinks', range: '₩35,000 - ₩70,000 / day' },
                { category: 'T-Money / Taxi', range: '₩5,000 - ₩15,000 / day' },
                { category: 'Daily Budget', range: '₩160,000 - ₩300,000' }
            ],
            visaRequirements: [
                'Valid Passport',
                'K-ETA (for some nationalities)',
                'Photograph',
                'Visa Application Form',
                'Flight & Hotel Bookings'
            ],
            whyContent: 'South Korea is a destination that vibrates with energy, offering a travel experience that is as exciting as it is welcoming.'
        }
    },
};

