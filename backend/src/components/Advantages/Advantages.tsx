import { useTranslation } from 'react-i18next'
import styles from './Advantages.module.scss'
const Advantages = () => {
    const {t} = useTranslation()
    const dataAdvantages = [
        {
            title: t('advanteges.titleOne'),
            info: t('advanteges.infoOne'),
            img: 'https://optim.tildacdn.one/tild3539-6532-4464-a630-643961636464/-/resize/300x/-/format/webp/1.png'
        },
        {
            title: t('advanteges.titleTwo'),
            info: t('advanteges.infoTwo'),
            img: 'https://optim.tildacdn.one/tild6230-3732-4531-b230-346561623761/-/resize/300x/-/format/webp/2.png'
        },
        {
            title: t('advanteges.titleThree'),
            info: t('advanteges.infoThree'),
            img: 'https://optim.tildacdn.one/tild3863-3934-4932-a637-643630636432/-/resize/300x/-/format/webp/3.png'
        },
        {
            title: t('advanteges.titleFour'),
            info: t('advanteges.infoFour'),
            img: 'https://optim.tildacdn.one/tild6231-3333-4031-b831-353539353232/-/resize/300x/-/format/webp/4.png'
        }
    ]
  return (
    <div className={`${styles.advantages__content} container`}>
        <h3>{t('advanteges.title')}</h3>
        <div className={styles.advantages__info}>
            {
                dataAdvantages.map((advantage, index) => (
                    <div className={styles.advantage__item} key={index}>
                        <div className={styles.advantage__info}>
                        <h4>{advantage.title}</h4>
                        <p>{advantage.info}</p>
                        </div>
                        <img src={advantage.img} alt="advantage"/>
                    </div>
                ))
            }
        </div>
    </div>
  )
}

export default Advantages
