import { useTranslation } from 'react-i18next'
import styles from './Analytics.module.scss'
const Analytics = () => {
    const {t} = useTranslation()
  return (
    <section className={styles.analytics}>
        <div className={`${styles.analytics__content} container`}>
            <h2>{t('titleAnal')}</h2>
            <p>{t('analInfo')}</p>
            <iframe src="https://www.youtube.com/embed/RmiwR3QahIQ" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
        </div>
    </section>
  )
}

export default Analytics
