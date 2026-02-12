import React, { useState, useEffect } from 'react';
import { X } from '@/components/common/icons';
import type { Coupon, LmsCourse } from '@/types';

interface CouponEditModalProps {
  coupon: Coupon | null;
  onClose: () => void;
  onSave: (coupon: Coupon) => void;
  courses: LmsCourse[];
}

const CouponEditModal: React.FC<CouponEditModalProps> = ({ coupon, onClose, onSave, courses }) => {
  const [code, setCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [applicableCourseIds, setApplicableCourseIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  
  const isNew = !coupon;

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code);
      setDiscountPercentage(String(coupon.discountPercentage));
      setIsActive(coupon.isActive);
      setApplicableCourseIds(coupon.applicableCourseIds || []);
    } else {
      setCode('');
      setDiscountPercentage('');
      setIsActive(true);
      setApplicableCourseIds([]);
    }
    setError('');
  }, [coupon]);

  const handleCourseSelection = (courseId: string) => {
    setApplicableCourseIds(prev =>
        prev.includes(courseId)
            ? prev.filter(id => id !== courseId)
            : [...prev, courseId]
    );
  };

  const handleSave = () => {
    const percentage = parseInt(discountPercentage, 10);
    if (!code.trim()) {
      setError('Coupon code cannot be empty.');
      return;
    }
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      setError('Discount must be a number between 1 and 100.');
      return;
    }
    onSave({
      code: code.toUpperCase().trim(),
      discountPercentage: percentage,
      isActive,
      applicableCourseIds,
    });
  };

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-[60] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{isNew ? 'New Coupon' : 'Edit Coupon'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label htmlFor="coupon-code" className={labelClasses}>Coupon Code</label>
            <input id="coupon-code" type="text" value={code} onChange={e => setCode(e.target.value)} disabled={!isNew} className={`${inputClasses} ${!isNew ? 'bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed' : ''}`} />
            {isNew && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Coupon code cannot be changed after creation.</p>}
          </div>
          <div>
            <label htmlFor="coupon-discount" className={labelClasses}>Discount Percentage (%)</label>
            <input id="coupon-discount" type="number" min="1" max="100" value={discountPercentage} onChange={e => setDiscountPercentage(e.target.value)} className={inputClasses} />
          </div>

          <div>
            <label className={labelClasses}>Applicable Courses</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                Select specific courses this coupon applies to. Leave empty to apply to all courses.
            </p>
            <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2 space-y-2">
                {courses.map(course => (
                    <div key={course.id} className="flex items-center">
                        <input
                            type="checkbox"
                            id={`course-${course.id}`}
                            checked={applicableCourseIds.includes(course.id)}
                            onChange={() => handleCourseSelection(course.id)}
                            className="h-4 w-4 rounded border-gray-300 text-lyceum-blue focus:ring-lyceum-blue"
                        />
                        <label htmlFor={`course-${course.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-200">{course.title}</label>
                    </div>
                ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Status</span>
            <button onClick={() => setIsActive(!isActive)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isActive ? 'bg-lyceum-blue' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm">Cancel</button>
          <button onClick={handleSave} className="ml-3 px-4 py-2 bg-lyceum-blue text-white rounded-md text-sm">Save Coupon</button>
        </div>
      </div>
    </div>
  );
};

export default CouponEditModal;