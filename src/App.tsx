import TopNav from './TopNav'
import Sidebar from './Sidebar'
import MainPage from './MainPage'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <TopNav />
      <div className="app__body">
        <Sidebar />
        <main className="app__main">
          <MainPage />
        </main>
      </div>
    </div>
  )
}
