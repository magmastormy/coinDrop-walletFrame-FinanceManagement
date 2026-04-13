import { useState, useCallback } from 'react';

export const useFormManager = (initialState) => {
  const [formData, setFormData] = useState(initialState);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateForm = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialState);
  }, [initialState]);

  return {
    formData,
    setFormData,
    updateField,
    updateForm,
    resetForm
  };
};

export default useFormManager;
