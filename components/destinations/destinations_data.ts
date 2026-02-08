
import { GraduationCap, Globe, Users, TrendingUp, Award, Clock, BookOpen, MapPin, Plane, FileText, Shield, Calendar } from 'lucide-react';

export interface DestinationDetail {
    id: string;
    country: string;
    flag: string;
    image: string;
    heroText: string;
    overview: string;
    statistics: {
        label: string;
        value: string;
        icon: any;
    }[];
    highlights: string[];
    topUniversities: string[];
    popularCourses: string[];
    costOfLiving: {
        category: string;
        range: string;
    }[];
    visaRequirements: string[];
    whyStudy: string;
}

export const DESTINATIONS_DATA: Record<string, DestinationDetail> = {
    usa: {
        id: 'usa',
        country: 'USA',
        flag: 'us',
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
        topUniversities: [
            'Harvard University',
            'Stanford University',
            'MIT',
            'University of California, Berkeley',
            'Columbia University'
        ],
        popularCourses: [
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
        whyStudy: 'Studying in the USA provides access to unparalleled academic resources, industry connections, and a global perspective that is highly valued by employers worldwide.'
    },
    uk: {
        id: 'uk',
        country: 'UK',
        flag: 'gb',
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
        topUniversities: [
            'University of Oxford',
            'University of Cambridge',
            'Imperial College London',
            'UCL',
            'University of Edinburgh'
        ],
        popularCourses: [
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
        whyStudy: 'The UK\'s education system is designed to fast-track your career with intensive programs and a focus on critical thinking and practical experience.'
    },
    canada: {
        id: 'canada',
        country: 'Canada',
        flag: 'ca',
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
        topUniversities: [
            'University of Toronto',
            'University of British Columbia',
            'McGill University',
            'University of Waterloo',
            'University of Alberta'
        ],
        popularCourses: [
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
        whyStudy: 'Canada offers a unique blend of academic excellence and career growth, with a strong emphasis on welcoming international talent into its workforce.'
    },
    australia: {
        id: 'australia',
        country: 'Australia',
        flag: 'au',
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
        topUniversities: [
            'University of Melbourne',
            'University of Sydney',
            'University of Queensland',
            'Monash University',
            'UNSW Sydney'
        ],
        popularCourses: [
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
        whyStudy: 'Australia provides a supportive education ecosystem with high standards of living and excellent career prospects in diverse sectors.'
    },
    europe: {
        id: 'europe',
        country: 'Europe',
        flag: 'eu',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop',
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
        topUniversities: [
            'Technical University of Munich (Germany)',
            'Sorbonne University (France)',
            'University of Amsterdam (Netherlands)',
            'ETH Zurich (Switzerland)',
            'Politecnico di Milano (Italy)'
        ],
        popularCourses: [
            'Automotive Engineering',
            'Luxury Brand Management',
            'Mechatronics',
            'Business & Sustainability',
            'Architecture'
        ],
        costOfLiving: [
            { category: 'Accommodation', range: '€400 - €900 / month' },
            { category: 'Food & Groceries', range: '€200 - €350 / month' },
            { category: 'Transport', range: '€30 - €70 / month' },
            { category: 'Total Monthly', range: '€700 - €1,400' }
        ],
        visaRequirements: [
            'Admission Letter / Zulassungsbescheid',
            'Blocked Account (for Germany)',
            'National Visa (Type D)',
            'Health Insurance',
            'Proof of Language Proficiency'
        ],
        whyStudy: 'Europe is the perfect choice for students seeking high-quality education without the high cost, combined with an unparalleled cultural experience.'
    },
    'new-zealand': {
        id: 'new-zealand',
        country: 'New Zealand',
        flag: 'nz',
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
        topUniversities: [
            'University of Auckland',
            'University of Otago',
            'Victoria University of Wellington',
            'University of Canterbury',
            'Massey University'
        ],
        popularCourses: [
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
        whyStudy: 'New Zealand is ideal for students looking for a safe, serene environment that doesn\'t compromise on academic rigor and global recognition.'
    }
};

