import TestimonialSlider from '../TestimonialSlider/TestimonialSlider';
import './Comments.scss'


import { useTranslation } from 'react-i18next';

const Comments = () => {
    const {t} = useTranslation()
    return (
        <section className='comments'>
            <h4>{t('comments.title')}</h4>
            <TestimonialSlider/>
        </section>
      );
}

export default Comments
