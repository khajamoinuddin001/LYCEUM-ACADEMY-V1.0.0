import React, { useState, useEffect } from 'react';
import type { LmsCourse, User, Coupon } from '../types';
import { IndianRupee, Lock, CheckCircle2 } from './icons';
declare const Razorpay: any;

interface PaymentGatewayViewProps {
    course: LmsCourse;
    user: User;
    coupons: Coupon[];
    onPaymentSuccess: () => void;
    onCancel: () => void;
}

const PaymentGatewayView: React.FC<PaymentGatewayViewProps> = ({ course, user, coupons, onPaymentSuccess, onCancel }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [finalPrice, setFinalPrice] = useState(course.price || 0);

    useEffect(() => {
        const originalPrice = course.price || 0;
        if (appliedCoupon) {
            const discountAmount = (originalPrice * appliedCoupon.discountPercentage) / 100;
            setFinalPrice(Math.round(originalPrice - discountAmount));
        } else {
            setFinalPrice(originalPrice);
        }
    }, [appliedCoupon, course.price]);

    const handleApplyCoupon = () => {
        setCouponMessage(null);
        setAppliedCoupon(null);
        const foundCoupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());

        if (foundCoupon && foundCoupon.isActive) {
            const isApplicable = !foundCoupon.applicableCourseIds || foundCoupon.applicableCourseIds.length === 0 || foundCoupon.applicableCourseIds.includes(course.id);
            
            if (isApplicable) {
                setAppliedCoupon(foundCoupon);
                setCouponMessage({ type: 'success', text: `Success! ${foundCoupon.discountPercentage}% discount applied.` });
            } else {
                setCouponMessage({ type: 'error', text: 'This coupon is not valid for the selected course.' });
            }
        } else {
            setCouponMessage({ type: 'error', text: 'Invalid or expired coupon code.' });
        }
    };

    const handlePayment = () => {
        setIsProcessing(true);
        setError('');

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_YOUR_KEY_ID', 
            amount: finalPrice * 100, 
            currency: 'INR',
            name: 'Lyceum Academy',
            description: `Course Purchase: ${course.title}`,
            image: '/vite.svg',
            handler: function (response: any) {
                console.log('Razorpay Response:', response);
                setIsProcessing(false);
                setIsSuccess(true);
                setTimeout(() => {
                    onPaymentSuccess();
                }, 1500);
            },
            prefill: {
                name: user.name,
                email: user.email,
            },
            notes: {
                course_id: course.id,
                user_id: user.id,
                applied_coupon: appliedCoupon?.code || 'none',
            },
            theme: {
                color: '#2A6F97'
            },
            modal: {
                ondismiss: function() {
                    console.log('Razorpay modal dismissed.');
                    setIsProcessing(false);
                }
            }
        };

        try {
            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response: any){
                console.error('Razorpay Payment Failed:', response.error);
                setError(`Payment failed: ${response.error.description}`);
                setIsProcessing(false);
            });
            rzp.open();
        } catch (err) {
            console.error('Razorpay Error:', err);
            setError('Payment gateway could not be loaded. Please check your internet connection and try again.');
            setIsProcessing(false);
        }
    };
    

    if (isSuccess) {
        return (
            <div className="animate-fade-in max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Payment Successful!</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">You are now enrolled in "{course.title}".</p>
                <p className="text-sm text-gray-500 mt-4">Redirecting you to the course...</p>
            </div>
        )
    }

    return (
        <div className="animate-fade-in max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">Checkout</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-8">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Order Summary</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{course.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">by {course.instructor}</p>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center whitespace-nowrap">
                                <IndianRupee size={18} className="mr-1" />
                                {course.price?.toLocaleString('en-IN')}
                            </p>
                        </div>

                        <div className="pt-4 space-y-2">
                             <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter coupon code"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                                />
                                <button onClick={handleApplyCoupon} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">Apply</button>
                            </div>
                            {couponMessage && (
                                <p className={`text-xs ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{couponMessage.text}</p>
                            )}
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                <span>Subtotal</span>
                                <span className='flex items-center'><IndianRupee size={14} className="mr-1"/>{course.price?.toLocaleString('en-IN')}</span>
                            </div>
                            {appliedCoupon && (
                                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                                    <span>Discount ({appliedCoupon.discountPercentage}%)</span>
                                    <span>- <span className='inline-flex items-center'><IndianRupee size={14} className="mr-1"/>{((course.price || 0) * appliedCoupon.discountPercentage / 100).toLocaleString('en-IN')}</span></span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold text-gray-800 dark:text-gray-100">
                                <span>Total</span>
                                <span className='flex items-center'><IndianRupee size={20} className="mr-1"/>{finalPrice.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center gap-4">
                    <button 
                        onClick={handlePayment} 
                        disabled={isProcessing}
                        className="w-full inline-flex items-center justify-center px-6 py-3 bg-lyceum-blue text-white rounded-md shadow-sm text-lg font-semibold hover:bg-lyceum-blue-dark transition-colors disabled:bg-gray-400"
                    >
                       {isProcessing ? (
                           <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                           </>
                       ) : (
                           <>
                            <Lock size={18} className="mr-2" />
                            Proceed to Pay <span className='inline-flex items-center ml-2'><IndianRupee size={18}/>{finalPrice.toLocaleString('en-IN')}</span>
                           </>
                       )}
                    </button>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <button onClick={onCancel} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue">
                        Cancel and return to course page
                    </button>
                    <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                        <Lock size={12} className="mr-1.5" />
                        <span>Payments powered by <span className="font-bold text-blue-500">Razorpay</span></span>
                    </div>
                </div>
            </div>
            <style>{`
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

export default PaymentGatewayView;