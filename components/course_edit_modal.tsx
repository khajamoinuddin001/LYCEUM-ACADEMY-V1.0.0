import React, { useState, useEffect } from 'react';
import { X } from './icons';
import type { LmsCourse } from '../types';

interface CourseEditModalProps {
  course: Omit<LmsCourse, 'id' | 'modules'> | LmsCourse | null;
  onClose: () => void;
  onSave: (courseData: Omit<LmsCourse, 'id' | 'modules'> | LmsCourse) => void;
}

const CourseEditModal: React.FC<CourseEditModalProps> = ({ course, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructor, setInstructor] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const isNew = !course || !('id' in course);

  useEffect(() => {
    if (course) {
      setTitle(course.title || '');
      setDescription(course.description || '');
      setInstructor(course.instructor || '');
      if ('price' in course) {
        setPrice(String(course.price || ''));
      } else {
        setPrice('');
      }
    } else {
      setTitle('');
      setDescription('');
      setInstructor('');
      setPrice('');
    }
    setError('');
  }, [course]);
  
  const handleSave = () => {
    if (!title.trim() || !description.trim() || !instructor.trim()) {
      setError('All fields are required.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
        setError('Please enter a valid, non-negative price.');
        return;
    }

    const courseData = {
        ...course,
        title,
        description,
        instructor,
        price: parsedPrice,
    };
    onSave(courseData as LmsCourse);
  };
  
  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";


  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-fast">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{isNew ? 'Create New Course' : 'Edit Course'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="course-title" className={labelClasses}>Course Title</label>
            <input id="course-title" type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label htmlFor="course-desc" className={labelClasses}>Description</label>
            <textarea id="course-desc" rows={3} value={description} onChange={e => setDescription(e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label htmlFor="course-inst" className={labelClasses}>Instructor</label>
            <input id="course-inst" type="text" value={instructor} onChange={e => setInstructor(e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label htmlFor="course-price" className={labelClasses}>Price (₹)</label>
            <input id="course-price" type="number" value={price} onChange={e => setPrice(e.target.value)} className={inputClasses} placeholder="e.g. 4999" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm">Cancel</button>
          <button onClick={handleSave} className="ml-3 px-4 py-2 bg-lyceum-blue text-white rounded-md text-sm">Save</button>
        </div>
      </div>
    </div>
  );
};

export default CourseEditModal;