import React from 'react';
import type { LmsCourse, Contact } from '@/types';
import { ArrowLeft, GraduationCap, Download } from '@/components/common/icons';

interface CertificateViewProps {
    course: LmsCourse;
    student: Contact;
    onBack: () => void;
}

const CertificateView: React.FC<CertificateViewProps> = ({ course, student, onBack }) => {
    const completionDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4 print:hidden">
                <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue transition-colors">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Course
                </button>
                <button onClick={handlePrint} className="inline-flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark">
                    <Download size={16} className="mr-2" />
                    Print or Save as PDF
                </button>
            </div>

            <div id="certificate" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-4 border-lyceum-blue-dark dark:border-lyceum-blue p-8 aspect-[1.414/1] flex flex-col items-center justify-center text-center relative overflow-hidden">
                {}
                <div className="absolute top-0 left-0 w-24 h-24 bg-lyceum-blue/10 rounded-br-full"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-lyceum-blue/10 rounded-tl-full"></div>

                <div className="mb-6">
                    <GraduationCap size={80} className="text-lyceum-blue-dark dark:text-lyceum-blue mx-auto" />
                </div>
                
                <h1 className="text-4xl font-bold text-lyceum-blue-dark dark:text-lyceum-blue mb-2">Certificate of Completion</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">This is to certify that</p>
                
                <p className="text-5xl font-['Poppins'] font-bold text-gray-800 dark:text-gray-100 my-8 border-b-2 border-lyceum-blue pb-2">
                    {student.name}
                </p>
                
                <p className="text-lg text-gray-600 dark:text-gray-300">has successfully completed the course</p>
                <p className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mt-2 mb-8">
                    {course.title}
                </p>

                <div className="mt-auto pt-8 w-full flex justify-between text-sm">
                    <div className="text-left">
                        <p className="border-t-2 border-gray-400 pt-2 font-semibold text-gray-700 dark:text-gray-200">{course.instructor}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Instructor</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-lyceum-blue">lyceum</p>
                    </div>
                    <div className="text-right">
                        <p className="border-t-2 border-gray-400 pt-2 font-semibold text-gray-700 dark:text-gray-200">{completionDate}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Date of Completion</p>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body > *:not(#root), #root > *:not(div:has(> .animate-fade-in)) {
                        display: none !important;
                    }
                    .animate-fade-in {
                        max-width: none !important;
                        margin: 0 !important;
                    }
                    #root, #root > div {
                        display: block !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                    }
                    #certificate {
                        box-shadow: none !important;
                        border: 4px solid #01497C !important;
                        margin: 0 !important;
                        width: 100% !important;
                        height: 100vh !important;
                        border-radius: 0 !important;
                    }
                }
                @page {
                    size: A4 landscape;
                    margin: 0;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default CertificateView;
