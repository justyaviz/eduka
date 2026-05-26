import { useTranslation } from 'react-i18next'
import styles from './Statistics.module.scss'
const Statistics = () => {
    const {t} = useTranslation()
    const dataStatistics = [
        {
            title: t('statistics.centerOfNumber'),
            number: 300
        },
        {
            title: t('statistics.numberOfBranches'),
            number: 500
        },
        {
            title: t('statistics.numberOfGroups'),
            number: 7250
        },
        {
            title: t('statistics.numberOfPupil'),
            number: 40000
        }
    ]
  return (
    <section className={`${styles.statistics}`}>
        <div className={`container`}>
        <h2>{t('statistics.title')}</h2>
            <div className={`${styles.statistics__content}`}>
                {
                    dataStatistics.map((item, index) => (
                        <div className={styles.statistics__item} key={index}>
                            <p>{item.title}</p>
                            <h3>{item.number}+</h3>
                        </div>
                    ))
                }
                </div>
        </div>
    </section>
  )
}

export default Statistics
