"use client";

import { FormikErrors, FormikHelpers, FormikTouched, useFormik } from "formik";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDebounce, useEffectOnce, useLocalStorage } from "usehooks-ts";
import { toFormikValidationSchema } from "zod-formik-adapter";
import {
  IMPORT_CALCULATOR_INITIAL_VALUE,
  IMPORT_CALCULATOR_NEW_ROW,
} from "../constants/importCalculator";
import { localStorageKey } from "../constants/keys";
import { calculateImportation, getImportReport } from "../lib/modules/calculator";
import { ImportCalculatorValidationSchema } from "../lib/parsers/importCalculator";
import importCalculation from "../services/firestore/importCalculator";
import { ImportCalculator } from "../types/calculator";

interface Props {
  children: ReactNode;
  fetchedValues?: ImportCalculator;
}
interface Context {
  values: ImportCalculator;
  addRow: VoidFunction;
  deleteRow: (_id: number) => void;
  resetCalculator: VoidFunction;
  addNote: (_body: string) => void;
  deleteNote: (_id: number) => void;
  errors: FormikErrors<ImportCalculator>;
  handleChange: (_e: React.ChangeEvent<unknown>) => void;
  setFieldValue: (
    _field: string,
    _value: string | number,
  ) => Promise<void> | Promise<FormikErrors<ImportCalculator>>;
  touched: FormikTouched<ImportCalculator>;
  calculate: VoidFunction;
  totalCost: number;
  totalWeight: number;
  calculatorReport: ApexAxisChartSeries;
  submitForm: VoidFunction;
}

const ImpCalculatorContext = createContext<Context>({} as Context);

export const ImpCalculatorProvider = ({ children, fetchedValues }: Props) => {
  const [calculatorInputs, setCalculatorInputs] = useLocalStorage<ImportCalculator>(
    localStorageKey.importCalculator,
    IMPORT_CALCULATOR_INITIAL_VALUE,
  );
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [calculatorReport, setCalculatorReport] = useState<ApexAxisChartSeries>([]);

  const handleOnSubmit = async (
    formData: ImportCalculator,
    actions: FormikHelpers<ImportCalculator>,
  ) => {
    const result = await importCalculation.upsert(formData);

    if (result) {
      actions.setSubmitting(false);
      actions.resetForm();
    }
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    resetForm,
    setValues,
    setFieldValue,
    submitForm,
    handleReset,
    handleSubmit,
  } = useFormik<ImportCalculator>({
    initialValues: calculatorInputs || IMPORT_CALCULATOR_INITIAL_VALUE,
    onSubmit: handleOnSubmit,
    validationSchema: toFormikValidationSchema(ImportCalculatorValidationSchema),
  });

  const debouncedValues = useDebounce<ImportCalculator>(values, 1000);

  const addRow = useCallback(() => {
    setValues((prevState) => ({
      ...prevState,
      items: [...prevState.items, IMPORT_CALCULATOR_NEW_ROW],
    }));
  }, [setValues]);

  const deleteRow = useCallback(
    (id: number) => {
      setValues((prevState) => ({
        ...prevState,
        items: prevState.items.filter((_, index) => index !== id),
      }));
    },
    [setValues],
  );

  const addNote = useCallback(
    (note: string) => {
      setValues((prevState) => ({
        ...prevState,
        notes: [...prevState.notes, note],
      }));
    },
    [setValues],
  );

  const deleteNote = useCallback(
    (id: number) => {
      setValues((prevState) => ({
        ...prevState,
        notes: prevState.notes.filter((_, index) => index !== id),
      }));
    },
    [setValues],
  );

  const resetCalculator = useCallback(() => {
    setCalculatorInputs(IMPORT_CALCULATOR_INITIAL_VALUE);
    resetForm({ values: IMPORT_CALCULATOR_INITIAL_VALUE });
    setCalculatorReport([]);
  }, [resetForm, setCalculatorInputs]);

  const calculate = useCallback(() => {
    const { pricesArray, articlesReport } = calculateImportation(values);

    setValues((prevState) => ({
      ...prevState,
      items: prevState.items.map((item, index) => ({
        ...item,
        unitPrice: pricesArray[index],
      })),
    }));

    setCalculatorReport(getImportReport(articlesReport));
  }, [setValues, values]);

  useEffect(() => {
    setCalculatorInputs(debouncedValues);
    setTotalCost(
      debouncedValues.items.reduce((acc, item) => acc + item.unitCost * item.quantity, 0),
    );
    setTotalWeight(
      debouncedValues.items.reduce((acc, item) => acc + item.unitWeight * item.quantity, 0),
    );
  }, [debouncedValues, setCalculatorInputs]);

  useEffectOnce(() => {
    if (fetchedValues) {
      setCalculatorInputs(fetchedValues);
      setValues(fetchedValues);
    }
  });

  const contextValues: Context = useMemo(
    () => ({
      values,
      addRow,
      deleteRow,
      resetCalculator,
      addNote,
      deleteNote,
      errors,
      handleChange,
      setFieldValue,
      touched,
      calculate,
      totalCost,
      totalWeight,
      calculatorReport,
      submitForm,
    }),
    [
      addNote,
      addRow,
      deleteNote,
      deleteRow,
      errors,
      handleChange,
      resetCalculator,
      setFieldValue,
      touched,
      values,
      calculate,
      totalCost,
      totalWeight,
      calculatorReport,
      submitForm,
    ],
  );
  return (
    <ImpCalculatorContext.Provider value={contextValues}>
      <form onSubmit={handleSubmit} onReset={handleReset}>
        {children}
      </form>
    </ImpCalculatorContext.Provider>
  );
};

export const useImpCalculatorContext = () => useContext(ImpCalculatorContext);
