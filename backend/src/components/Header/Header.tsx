import styles from './Header.module.scss';
import instagram from '../../assets/icons/instagram.svg';
import youtube from '../../assets/icons/youtube.svg';
import telegram from '../../assets/icons/telegram.svg';
import burgerMenu from '../../assets/icons/burger-menu.png';
import HeaderProp from '../../interfaces/HeaderProp';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Header: React.FC<HeaderProp> = ({ changeLang }) => {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();
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

    const changeLangHandler = (lang: string) => {
        changeLang(lang);
    };

    return (
        <header id='register'>
            <div className={`${styles.header_content} container`}>
                <img 
                    className={styles.logo} 
                    src={'https://thb.tildacdn.one/tild3266-3464-4535-a338-366131636236/-/resize/504x/Modme.png'} 
                    alt="logo" 
                />
                <div className={styles.decription}>
                    <div className={styles.contact_info}>
                        <span>+998 78 777 11 00</span>
                        <br />
                        <span>{t('addres')}</span>
                    </div>
                    <div className={styles.messengers}>
                        {messengers.map(messenger => (
                            <div key={messenger.id}>
                                <a href={messenger.link} target='_blank' rel="noopener noreferrer">
                                    <img src={messenger.img} alt="messenger" />
                                </a>
                            </div>
                        ))}
                    </div>
                    <select onChange={(e) => changeLangHandler(e.target.value)}>
                        <option value="uz">UZ</option>
                        <option value="en">EN</option>
                        <option value="ru">RU</option>
                    </select>
                </div>
                <img 
                    src={burgerMenu} 
                    onClick={() => setOpen(!open)} 
                    className={styles.burgerIcon} 
                    alt='burger menu' 
                    width={50} 
                />
            </div>
            <div className={`${styles.burger} ${open ? styles.open : ''}`}>
                <img 
                    src={burgerMenu} 
                    onClick={() => setOpen(false)} 
                    className={styles.burgerIcon} 
                    alt='close menu' 
                    width={30} 
                    style={{ position: 'absolute', bottom: '20px' }} // Positioned at the bottom of the menu
                />
                <div className={styles.burger_contact_info}>
                    <span>+998 78 777 11 00</span>
                    <br />
                    <span>{t('addres')}</span>
                </div>
                <div className={styles.burger_messengers}>
                    {messengers.map(messenger => (
                        <div key={messenger.id}>
                            <a href={messenger.link} target='_blank' rel="noopener noreferrer">
                                <img src={messenger.img} alt="messenger" />
                            </a>
                        </div>
                    ))}
                </div>
                <div className={styles.buttons}>
                    <button onClick={() => changeLangHandler('uz')}>UZ</button>
                    <button onClick={() => changeLangHandler('en')}>EN</button>
                </div>
            </div>
        </header>
    );
};

export default Header;
