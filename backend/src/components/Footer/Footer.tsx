import { useTranslation } from 'react-i18next'
import styles from './Footer.module.scss'
import instagram from '../../assets/icons/instagram.svg';
import youtube from '../../assets/icons/youtube.svg';
import telegram from '../../assets/icons/telegram.svg';
const Footer = () => {
    const {t} = useTranslation()
    const messengers = [
        {
            id: 1,
            img: instagram,
            link: 'https://www.instagram.com/level_up_karshi/'
        },
        {
            id: 2,
            img: youtube,
            link: 'https://www.youtube.com/@modme.uz'
        },
        {
            id: 3,
            img: telegram,
            link: 'https://t.me/level_up_karshi'
        }
    ];
  return (
    <div className={`${styles.footer}`}>
        <div className={`${styles.footer_content} container`}>
            <button><a href="#register">{t('buttonTitle')}</a></button>
            <div className={styles.footer_line}>
                <div className={styles.location}>
                    {t('footer.addres')}
                </div>
                <div className={styles.working_time}>
                    {t('footer.workTime')}
                </div>
                <div className={styles.phone}>
                    78 777 11 00
                </div>
                <span>modme.uz</span>
                <div className={styles.messengers}>
                    {
                        messengers.map(messenger => (
                            <div key={messenger.id}>
                                <a href={messenger.link} target='_blank' rel="noopener noreferrer">
                                    <img src={messenger.img} alt="messenger" />
                                </a>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    </div>
  )
}

export default Footer
