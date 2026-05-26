import Header from '../src/components/Header/Header'
import GetDemo from './components/GetDemo/GetDemo'
import Analytics from './components/Analytics/Analytics'
import Services from './components/Services/Services'
import Statistics from './components/Statistics/Statistics'
import i18next from 'i18next'
import Sponsors from './components/Sponsors/Sponsors'
import Team from './components/Team/Team'
import Advantages from './components/Advantages/Advantages'
import Comments from './components/Comments/Comments'
import Footer from './components/Footer/Footer'
const App = () => {
    const changeLang = (lang: string) => {
        i18next.changeLanguage(lang)
    }

  return (
    <div>
            <div className='top_content'>
                <Header changeLang={changeLang}/>
                <GetDemo />
            </div>
            <Analytics/>
            <Services/>
            <Statistics/>
            <Sponsors/>
            <Team/>
            <Advantages/>
            <Comments/>
            <Footer/>
    </div>
  )
}

export default App
