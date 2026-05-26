import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import translationEn from './locale/translationEn'
import translationUz from './locale/translationUz'

i18next.use(initReactI18next).init({
    lng: 'uz',
    fallbackLng: 'en',
    resources: {
        en: {
            translation: translationEn
        },
        uz: {
            translation: translationUz
        }
    }
})