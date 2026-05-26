// import React from 'react';
// import { Swiper, SwiperSlide } from 'swiper/react';
// import 'swiper/css';
// import 'swiper/css/pagination';
// import './TestimonialSlider.scss';

interface Testimonial {
  content: string;
  author: string;
  position: string;
}

// const testimonials: Testimonial[] = [
//   {
//     content:
//       "Yuksalish Liderlar akademiyasining boshlaṅ ich 2 oy davomida juda ko‘plab qiynichiliklarga duch keldik, moliyaviy hisob-kitob, kengayish va filiallarni tizimli boshqarishda juda qiynaldik. Va nihoyat jonimizga aroj kirgan platforma keldi, buning nomi Modme deb ataladi. Ushbu platformani ishlatish orqali ishimiz oson ko‘chdi.",
//     author: "MuhammadAli Eshonqulov",
//     position: "Yuksalish liderlar akademiyasi asoschisi",
//   },
//   {
//     content:
//       "Yuksalish Liderlar akademiyasining boshlaṅ ich 2 oy davomida juda ko‘plab qiynichiliklarga duch keldik, moliyaviy hisob-kitob, kengayish va filiallarni tizimli boshqarishda juda qiynaldik. Va nihoyat jonimizga aroj kirgan platforma keldi, buning nomi Modme deb ataladi. Ushbu platformani ishlatish orqali ishimiz oson ko‘chdi.",
//     author: "MuhammadAli Eshonqulov",
//     position: "Yuksalish liderlar akademiyasi asoschisi",
//   },
//   {
//     content:
//       "Yuksalish Liderlar akademiyasining boshlaṅ ich 2 oy davomida juda ko‘plab qiynichiliklarga duch keldik, moliyaviy hisob-kitob, kengayish va filiallarni tizimli boshqarishda juda qiynaldik. Va nihoyat jonimizga aroj kirgan platforma keldi, buning nomi Modme deb ataladi. Ushbu platformani ishlatish orqali ishimiz oson ko‘chdi.",
//     author: "MuhammadAli Eshonqulov",
//     position: "Yuksalish liderlar akademiyasi asoschisi",
//   },
//   {
//     content:
//       "Yuksalish Liderlar akademiyasining boshlaṅ ich 2 oy davomida juda ko‘plab qiynichiliklarga duch keldik, moliyaviy hisob-kitob, kengayish va filiallarni tizimli boshqarishda juda qiynaldik. Va nihoyat jonimizga aroj kirgan platforma keldi, buning nomi Modme deb ataladi. Ushbu platformani ishlatish orqali ishimiz oson ko‘chdi.",
//     author: "MuhammadAli Eshonqulov",
//     position: "Yuksalish liderlar akademiyasi asoschisi",
//   },
// ];

// const TestimonialSlider: React.FC = () => {
//   return (
//     <div className="testimonial-slider">
//       <Swiper
//         spaceBetween={50}
//         slidesPerView={1}
//         pagination={{ clickable: true }}
//       >
//         {testimonials.map((testimonial, index) => (
//           <SwiperSlide key={index}>
//             <div className="testimonial-content">
//               <p>{testimonial.content}</p>
//             </div>
//             <div className="testimonial-author">
//               <p>{testimonial.author}</p>
//               <small>{testimonial.position}</small>
//             </div>
//           </SwiperSlide>
//         ))}
//       </Swiper>
//     </div>
//   );
// };

// export default TestimonialSlider;
// Import Swiper React components
const testimonials: Testimonial[] = [
    {
      content:
        "Yuksalish Liderlar akademiyasining boshlaṅ ich 2 oy davomida juda ko‘plab qiynichiliklarga duch keldik, moliyaviy hisob-kitob, kengayish va filiallarni tizimli boshqarishda juda qiynaldik. Va nihoyat jonimizga aroj kirgan platforma keldi, buning nomi Modme deb ataladi. Ushbu platformani ishlatish orqali ishimiz oson ko‘chdi.",
      author: "MuhammadAli Eshonqulov",
      position: "Yuksalish liderlar akademiyasi asoschisi",
    },
    {
      content:
        "Ushbu platforma ishni juda osonlashtiradi. Qani endi bu platformadan o`quv markazimizni yo`lga qo`yganimizdan boshlab foydalanganimizda, bizni ancha yo`qotishdan saqlab qolar edi. Haqiqatda muammolarimizni yechganligi uchun Modme CRM platformasini ishlatishni barchaga tavsiya qilaman",
      author: "Shahzod Sobirov",
      position: "Data Learning Center asoschisi",
    },
    {
      content:
        "Biz rosmana ishlatishimizga bir oy bo`lgan bo`lsa, Modmega o`tishimiz bilan ancha ishlarimiz yengillashdi Allohga shukr, chin dildan aytilayotgan gap. Yana ham kuch-quvvat bersin sizlarga, Modme jamoasi ishlaringizga omad",
      author: "Alloma Sakhiyeva",
      position: "Fashion Art Academy asoschisi",
    },
    {
      content:
        "Modme platformasini ishlatishni boshlaganimizdan bir oy o`tib o`quvchilar soni keskin oshib ketdi. Hozirda tizimlashtirishga katta e`tibor beryapmiz, nimaga? Sababi o`quv markazi qancha kengaygani sari boshqaruv qiyinlashib bormoqda edi, ammo Modmeni ishlatishni boshlaganimizdan so`ng ishimiz ancha yengillashdi. Ushbu platforma yordamida hozirda o`quv markazda nechta o`quvchi bor, qanchasi qarzdor, nechtasi ketib qolyapti, moliyaviy holat va konversiya haqida to`liq ma`lumotga ega bo`lib turaman.",
      author: "Doston Nuraliyev",
      position: "English Life o`quv markazi asoschisi",
    },
  ];
  import { Swiper, SwiperSlide } from 'swiper/react';
  
  // Import Swiper styles
  import 'swiper/css';
  import 'swiper/css/pagination';
  import 'swiper/css/navigation';
  
  import './TestimonialSlider.scss';
  
  import { Navigation } from 'swiper/modules';
  
  export default function TestimonialSlider() {
    return (
      <Swiper
        slidesPerView={1}
        spaceBetween={30}
        loop={true}
        navigation={true}
        modules={[Navigation]}
        className="mySwiper"
      >
        {testimonials.map((testimonial, index) => (
          <SwiperSlide key={index}>
            <div className="slider_item">
              <div className="testimonial-content">
                <p>{testimonial.content}</p>
              </div>
              <div className="testimonial-author">
                <div className="author-img"></div>
                <p>{testimonial.author}</p>
                <small>{testimonial.position}</small>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    );
  }