
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy for Lyceum Academy</h1>
                </div>

                <div className="px-6 py-8 sm:p-10 space-y-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                    <section>
                        <p>At Lyceum Academy, accessible from www.lyceumacad.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Lyceum Academy and how we use it.</p>
                        <p className="mt-4">If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Log Files</h2>
                        <p>Lyceum Academy follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Cookies and Web Beacons</h2>
                        <p>Like any other website, Lyceum Academy uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Privacy Policies</h2>
                        <p>You may consult this list to find the Privacy Policy for each of the advertising partners of Lyceum Academy. Our Privacy Policy was created with the help of the Privacy Policy Generator and the Privacy Policy Generator Online.</p>
                        <p className="mt-4">Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on Lyceum Academy, which are sent directly to users' browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.</p>
                        <p className="mt-4">Note that Lyceum Academy has no access to or control over these cookies that are used by third-party advertisers.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Third Party Privacy Policies</h2>
                        <p>Lyceum Academy's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options. You may find a complete list of these Privacy Policies and their links here: Privacy Policy Links.</p>
                        <p className="mt-4">You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers' respective websites. What Are Cookies?</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Children's Information</h2>
                        <p>Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.</p>
                        <p className="mt-4">Lyceum Academy does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Online Privacy Policy Only</h2>
                        <p>This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in Lyceum Academy. This policy is not applicable to any information collected offline or via channels other than this website.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Consent</h2>
                        <p>By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;
