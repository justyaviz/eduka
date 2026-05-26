import styles from './Sponsors.module.scss'
import sponsorsImg from '../../assets/images/sponsors.jpg'
const Sponsors = () => {
  return (
    <div className={`${styles.sponsors} container`}>
        <img src={sponsorsImg} alt={sponsorsImg.toString()} />
    </div>
  )
}

export default Sponsors
