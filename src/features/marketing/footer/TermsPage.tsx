
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-8 sm:p-10 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms & Conditions</h1>
                </div>

                <div className="px-6 py-8 sm:p-10 space-y-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Welcome to Lyceum Academy!</h2>
                        <p>These terms and conditions outline the rules and regulations for using Lyceum Academy’s Website, located at www.lyceumacad.com, and our services located at 19-4-2/3/13, First Floor, Below Gladiator Gym, Opposite HP Petrol Pump, Falaknuma, Hyderabad, Telangana 500053.</p>
                        <p className="mt-4">By joining us and accessing this website, you accept these terms and conditions. Do not continue with Lyceum Academy if you do not agree to take all of the terms and conditions stated on this page.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">1. TERMINOLOGY</h2>
                        <p className="mb-4">1.1 The following terminology applies to these Terms and Conditions, Privacy Statement, Disclaimer Notice, and all Agreements: “Client”, “Student”, “He/She”, “You” and “Your” refer to you, the person using our services, logging on to this website, using an android application, and compliant to the Organisation’s terms and conditions. “The Organisation”, “The Company”, “Counsellor”, “Staff Members”, “Ourselves”, “We”, “Our” and “Us” refer to Lyceum Academy. “Party”, “Parties”, or “Us” refer to both the Client and ourselves.</p>
                        <p>All terms refer to the offer, acceptance, and consideration of payment necessary to undertake the process of our assistance to the Client in the most appropriate manner for the express purpose of meeting the Client’s needs in respect of the provision of the Organisation’s stated services, by and subject to, the prevailing law of India. Any use of the above terminology or other words in the singular, plural, capitalisation, and/or he/she or they, are taken as interchangeable and therefore as referring to the same.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">2. GENERAL TERMS</h2>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.1 Cookies</h3>
                            <p>We employ the use of cookies. By accessing Lyceum Academy, you agreed to use cookies in agreement with Lyceum Academy’s Privacy Policy. Most interactive websites use cookies to let us retrieve the user’s details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our affiliate/advertising partners may also use cookies.</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.2 License</h3>
                            <p className="mb-2">Unless otherwise stated, Lyceum Academy and/or its licensors own the intellectual property rights for all material on Lyceum Academy. All intellectual property rights are reserved. You may access this from Lyceum Academy for your personal use subject to restrictions set in these terms and conditions.</p>
                            <p className="mb-2">You must not:</p>
                            <ul className="list-disc pl-5 space-y-1 mb-2">
                                <li>Republish material from Lyceum Academy</li>
                                <li>Sell, rent, or sub-license material from Lyceum Academy</li>
                                <li>Reproduce, duplicate, or copy material from Lyceum Academy</li>
                                <li>Redistribute content from Lyceum Academy</li>
                            </ul>
                            <p className="mb-2">This Agreement shall begin on the date hereof.</p>
                            <p className="mb-2">Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. Lyceum Academy does not filter, edit, publish, or review Comments before their presence on the website. Comments do not reflect the views and opinions of Lyceum Academy, its agents, and/or affiliates. Comments reflect the views and opinions of the person who posts them.</p>
                            <p className="mb-2">To the extent permitted by applicable laws, Lyceum Academy shall not be liable for the Comments or any liability, damages, or expenses caused and/or suffered as a result of any use of and/or posting of and/or appearance of the Comments on this website.</p>
                            <p className="mb-2">Lyceum Academy reserves the right to monitor all Comments and to remove any Comments which can be considered inappropriate, offensive, or causes a breach of these Terms and Conditions.</p>
                            <p className="mb-2">You warrant and represent that:</p>
                            <ul className="list-disc pl-5 space-y-1 mb-2">
                                <li>You are entitled to post the Comments on our website and have all necessary licenses and consents to do so</li>
                                <li>The Comments do not invade any intellectual property right</li>
                                <li>The Comments do not contain defamatory, libellous, offensive, indecent, or unlawful material</li>
                                <li>The Comments will not be used to solicit or promote business or unlawful activity</li>
                            </ul>
                            <p>You hereby grant Lyceum Academy a non-exclusive license to use, reproduce, edit and authorise others to use, reproduce and edit any of your Comments in any forms, formats, or media.</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.3 Hyperlinking to our Content</h3>
                            <p className="mb-2">The following organizations may link to our Website without prior written approval:</p>
                            <ul className="list-disc pl-5 space-y-1 mb-2">
                                <li>Government agencies</li>
                                <li>Search engines</li>
                                <li>News organizations</li>
                                <li>Online directory distributors</li>
                                <li>System-wide Accredited Businesses (excluding charity fundraising organizations)</li>
                            </ul>
                            <p className="mb-2">Approved organizations may hyperlink to our Website by:</p>
                            <ul className="list-disc pl-5 space-y-1 mb-2">
                                <li>Using our corporate name</li>
                                <li>Using the URL being linked to</li>
                                <li>Any description that fits the context</li>
                            </ul>
                            <p>No use of Lyceum Academy’s logo or artwork will be allowed for linking without a trademark license agreement.</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.4 iFrames</h3>
                            <p>Without prior approval and written permission, you may not create frames around our Webpages that alter the visual presentation or appearance of our Website.</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.5 Your Privacy</h3>
                            <p>Please read the Privacy Policy.</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.6 Right to Entry</h3>
                            <p>We reserve the right to enter our premises. We hold the authority to stop anyone from entering or remove them from our premises.</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.7 Removal of links</h3>
                            <p>If you find any offensive links on our website, you may contact us. We are not obligated to remove them or respond directly.</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.8 Capturing photographs</h3>
                            <p>We may capture or record your photographs or video for promotional purposes. If you object, you may move away from the camera.</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.9 Responsibility for damages</h3>
                            <p>We will not be held responsible for any loss or damage to personal belongings or injuries due to negligence.</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.10 Application / Process cancellation</h3>
                            <p>2.10.1 Failure to pay any due amount may result in cancellation of the application, slot, or appointment.</p>
                            <p>2.10.2 We reserve the right to cancel or alter applications if financial obligations are not fulfilled.</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.11 Support System</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Queries must be emailed to support@lyceumacad.com</li>
                                <li>Support is provided only via the ticket system</li>
                                <li>Calls are answered during working hours only</li>
                            </ul>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">2.12 Disclaimer</h3>
                            <p>To the maximum extent permitted by law, Lyceum Academy excludes all liabilities except those which cannot be excluded under applicable law.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">3. TERMS FOR USA APPLICATIONS</h2>
                        <p className="mb-2">(All references now apply ONLY to Lyceum Academy)</p>
                        <ul className="list-disc pl-5 space-y-1 mb-2">
                            <li>Visa assistance only, no guarantees</li>
                            <li>Counselling is guidance-based</li>
                            <li>Fees once paid are non-refundable</li>
                            <li>Student bears responsibility for document accuracy</li>
                            <li>Deportation, visa rejection, or university decisions are not our liability</li>
                        </ul>
                        <p>(All remaining USA clauses are unchanged except name replacement.)</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">4. TERMS FOR AUSTRALIA APPLICATIONS</h2>
                        <p>Lyceum Academy provides guidance only. Visa approvals, extensions, deportation, or immigration decisions are solely under Australian authorities.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">5. VERIFICATION SERVICES</h2>
                        <p>Lyceum Academy is not responsible for fraudulent or inaccurate documents submitted by students.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">JURISDICTION</h2>
                        <p>All matters are subject to the jurisdiction of Hyderabad, Telangana, India only.</p>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default TermsPage;
