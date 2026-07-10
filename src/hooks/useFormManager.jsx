import { useState, useCallback, useRef } from 'react';

export const useFormManager = (initialState) => {
  const [formData, setFormData] = useState(initialState);
  const initialStateRef = useRef(initialState);
  initialStateRef.current = initialState;

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateForm = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialStateRef.current);
  }, []);

  return {
    formData,
    setFormData,
    updateField,
    updateForm,
    resetForm
  };
};

export default useFormManager;
