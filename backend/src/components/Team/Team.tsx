import { useTranslation } from 'react-i18next'
import teamLedImg from '../../assets/images/photo_2024-08-14_15-07-43.jpg'
import styles from './Team.module.scss'
const Team = () => {
    const {t} = useTranslation()
  return (
    <section className={styles.team}>
        <div className={`${styles.team__content} container`}>
            <h2>{t('team.title')}</h2>
            <div className={styles.team_images}>
                <img src={teamLedImg} alt="" className={styles.left_image} />
                <div>
                    <img src="https://static.tildacdn.one/tild3061-3034-4833-a433-303766336632/2022-03-08_190327.jpg" className={styles.right_image} alt="" />
                    <img src="https://static.tildacdn.one/tild3735-6238-4131-a164-636266363964/2022-03-08_190454.jpg" className={styles.right_image} alt="" />
                </div>
            </div>
        </div>
    </section>
  )
}

export default Team
