import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

i18next.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        name: "Name",
        age: "Age",
        feedback: "Feedback",
        submit: "Submit",
        total_responses: "Total Responses",
        average_age: "Average Age",
        recent_feedback: "Recent Feedback",
        download_csv: "Download Responses as CSV",
        search_feedback: "Search Feedback",
        create_survey: "Create Survey",
        generate_questions: "Generate Follow-up Questions",
        survey_title: "Survey Title",
        domain: "Domain",
        surveys: "Surveys",
      },
    },
    es: {
      translation: {
        name: "Nombre",
        age: "Edad",
        feedback: "Comentarios",
        submit: "Enviar",
        total_responses: "Respuestas Totales",
        average_age: "Edad Promedio",
        recent_feedback: "Comentarios Recientes",
        download_csv: "Descargar Respuestas como CSV",
        search_feedback: "Buscar Comentarios",
        create_survey: "Crear Encuesta",
        generate_questions: "Generar Preguntas de Seguimiento",
        survey_title: "Título de la Encuesta",
        domain: "Dominio",
        surveys: "Encuestas",
      },
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});