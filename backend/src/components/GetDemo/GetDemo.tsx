import { useTranslation } from 'react-i18next'
import AddPupil from '../AddStudent/AddStudent'
import styles from './GetDemo.module.scss'
const GetDemo = () => {
    const {t} = useTranslation()
  return (
    <div className={`${styles.get_demo} container`}>
        <div className={styles.info_content}>
            <h1>{t('info')}</h1>
            <p>{t('info2')}</p>
        </div>
      <AddPupil />
    </div>
  )
}

export default GetDemo
