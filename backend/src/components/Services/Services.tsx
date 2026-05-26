import styles from './Services.module.scss'
import { useTranslation } from 'react-i18next'
const Services = () => {
    const {t} = useTranslation()
    const servicesData = [
        {
            id: 1,
            title: t('services.titleOne'),
            info: t('services.infoOne'),
            img: 'https://optim.tildacdn.one/tild3364-3265-4331-b732-396462303833/-/resize/200x/-/format/webp/3.png'
        },
        {
            id: 2,
            title: t('services.titleTwo'),
            info: t('services.infoTwo'),
            img: 'https://optim.tildacdn.one/tild3735-6434-4263-a665-653161363763/-/resize/200x/-/format/webp/__-10-removebg-previ.png'
        },
        {
            id: 3,
            title: t('services.titleThree'),
            info: t('services.infoThree'),
            img: 'https://optim.tildacdn.one/tild3064-3434-4465-b333-366562373663/-/resize/200x/-/format/webp/__-9-removebg-previe.png'
        },
        {
            id: 4,
            title: t('services.titleFour'),
            info: t('services.infoFour'),
            img: 'https://optim.tildacdn.one/tild3463-3234-4363-b837-653263313866/-/resize/200x/-/format/webp/__-removebg-preview.png'
        }
    ]
  return (
    <div className={`${styles.services} container`}>
        <div className={styles.services__content}>

        {
            servicesData.map(service => (
                <div key={service.id} className={styles.services__item}>
                    <img src={service.img} alt="service" />
                    <div className={styles.services__info}>
                        <h3>{service.title}</h3>
                        <p>{service.info}</p>
                    </div>
                </div>
            ))
        }
        </div>
        <button>{t('services.buttonTitle')}</button>
    </div>
  )
}

export default Services
