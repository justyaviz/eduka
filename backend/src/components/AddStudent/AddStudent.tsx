import { useTranslation } from "react-i18next"
import style from './AddStudent.module.scss'
const AddPupil = () => {
const {t} = useTranslation()
const inputData = [
    {
        id: 1,
        title: t('input.name'),
    },
    {
        id: 2,
        title: t('input.eduName'),
    },
    {
        id: 3,
        title: t('input.phone'),
    },
    {
        id: 4,
        title: t('input.tgAddress'),
    },
]
  return (
    <form onSubmit={e => e.preventDefault()}>
        <p className={style.note}>{t('note.request')}</p>
        <p className={style.overview}>{t('note.overview')}</p>
        {inputData.map(input => <input key={input.id} type="text" placeholder={input.title} />)}
        <button>{t('buttonTitle')}</button>
        <span>{t('note.security')}</span>
    </form>
  )
}

export default AddPupil
