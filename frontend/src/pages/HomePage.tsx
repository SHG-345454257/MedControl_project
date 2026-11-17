import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Link } from "react-router-dom";

const advantages = [
  {
    image: "/images/home/ic_choice-1.svg",
    title: "Надежность",
    text: "Ваши данные защищены и хранятся в безопасности.",
  },
  {
    image: "/images/home/ic_choice-2.svg",
    title: "Простота использования",
    text: "Интуитивный интерфейс, понятный с первого взгляда.",
  },
  {
    image: "/images/home/ic_choice-3.svg",
    title: "Доступ с любого устройства",
    text: "Работает в браузере на любом устройстве.",
  },
  {
    image: "/images/home/ic_choice-4.svg",
    title: "Забота о всей семье",
    text: "Подключайте близких и контролируйте их лечение удаленно.",
  },
  {
    image: "/images/home/ic_choice-5.svg",
    title: "Экономия на лекарствах",
    text: "Сравнивайте цены в аптеках и покупайте по лучшим предложениям.",
  },
  {
    image: "/images/home/ic_choice-6.svg",
    title: "Путь к здоровью",
    text: "Мы помогаем формировать полезные привычки и заботиться о себе каждый день.",
  },
];

const features = [
  {
    image: "/images/home/Reminders.svg",
    title: "Напоминания",
    text: "Не пропускайте приём лекарств — приложение напомнит вовремя.",
    bg: "bg-green-bg",
  },
  {
    image: "/images/home/Med-Kit.svg",
    title: "Домашняя аптечка",
    text: "Следите за запасами и сроками годности препаратов.",
    bg: "bg-lilac-light",
  },
  {
    image: "/images/home/Discounts.svg",
    title: "Выгодные покупки",
    text: "Сравнивайте цены в аптеках и покупайте лекарства онлайн.",
    bg: "bg-green-bg",
  },
  {
    image: "/images/home/Family-Care.svg",
    title: "Забота о близких",
    text: "Контролируйте лечение родных и помогайте им быть здоровыми.",
    bg: "bg-lilac-light",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* =========================
            ПЕРВЫЙ БАННЕР
        ========================== */}
        <section className="w-full bg-background">
          <div className="mx-auto w-full max-w-[1600px]">
            <div className="relative min-h-[520px] overflow-hidden bg-background-soft">

              {/* Левая часть */}
              <div className="relative z-10 mx-auto flex h-full min-h-[520px] w-full max-w-[1400px] items-center px-6 py-14 sm:px-10 lg:px-16 xl:px-20">

                <div className="w-full max-w-[500px]">
                  <div className="mb-5 inline-flex rounded-pill bg-lilac-light px-4 py-2 text-[12px] text-text-secondary">
                    Забота о здоровье — проще, чем кажется
                  </div>

                  <h1 className="font-heading text-[36px] font-bold leading-[1.15] text-text-main sm:text-[42px] lg:text-[48px]">
                    Ваш личный помощник
                    <br />
                    в мире лекарств
                  </h1>

                  <p className="mt-5 max-w-[460px] text-[16px] leading-[1.55] text-text-secondary">
                    МедКонтроль — это удобное веб-приложение, которое
                    поможет не забыть о приеме лекарств, следить за запасами
                    в аптечке и выгодно покупать нужные препараты.
                  </p>

                  <Link
                    to="/register"
                    className="mt-8 flex h-[48px] w-fit items-center gap-4 rounded-pill bg-olive-accent px-6 text-[14px] text-white"
                  >
                    <span>Начать бесплатно</span>

                    <img
                      src="/images/arrow.svg"
                      alt=""
                      className="h-[22px] w-[22px] object-contain"
                    />
                  </Link>
                </div>

                {/* Картинка первого баннера */}
                <div className="absolute bottom-0 right-0 h-full w-[58%] overflow-hidden">
                  <img
                    src="/images/home/main-banner-1.svg"
                    alt=""
                    className="absolute bottom-0 right-0 h-full w-full object-contain object-right-bottom"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            4 ПРЕИМУЩЕСТВА
        ========================== */}
        <section className="w-full bg-background">
          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 px-6 py-9 sm:grid-cols-2 lg:grid-cols-4 lg:px-10 xl:px-0">

            {features.map((item, index) => (
              <div
                key={item.title}
                className={[
                  "relative flex flex-col px-5 py-3",
                  index !== 0
                    ? "lg:border-l lg:border-[#E7E5E1]"
                    : "",
                ].join(" ")}
              >
                {/* Круг + иконка */}
                <div
                  className={`mb-3 flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full ${item.bg}`}
                >
                  <img
                    src={item.image}
                    alt=""
                    className="h-[28px] w-[28px] object-contain"
                  />
                </div>

                <h3 className="font-heading text-[18px] font-bold leading-[1.25] text-text-main">
                  {item.title}
                </h3>

                <p className="mt-2 max-w-[250px] text-[14px] leading-[1.35] text-text-secondary">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* =========================
            ВТОРОЙ БАННЕР
        ========================== */}
        <section className="w-full bg-background">
          <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-8 lg:px-10 xl:px-0">
            <div className="relative min-h-[330px] overflow-hidden rounded-card bg-lilac-bg">

              {/* Весь баннер — одна картинка */}
              <img
                src="/images/home/main-banner-2.svg"
                alt=""
                className="absolute inset-0 h-full w-[90%] object-cover object-[70%_10%]"
              />

              {/* Текст поверх картинки */}
              <div className="relative z-10 flex min-h-[330px] items-center">
                <div className="ml-[32%] max-w-[590px] px-6 py-10 lg:ml-[31%] lg:px-0">

                  <div className="mb-5 inline-flex rounded-pill bg-olive-accent px-5 py-2 text-[12px] text-white">
                    Просто. Удобно. Для вас.
                  </div>

                  <h2 className="font-heading text-[36px] font-bold leading-[1.15] text-text-main lg:text-[42px]">
                    Контроль здоровья в
                    <br />
                    вашем телефоне
                  </h2>

                  <p className="mt-5 text-[16px] leading-[1.5] text-text-main">
                    МедКонтроль объединяет все важные функции в одном месте:
                    от напоминаний о приеме лекарств до поиска лучших цен
                    в аптеках.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================
            ПОЧЕМУ МЕДКОНТРОЛЬ
        ========================== */}
        <section className="w-full bg-background">
          <div className="mx-auto w-full max-w-[1400px] px-6 py-12 sm:px-8 lg:px-10 xl:px-0">

            <h2 className="font-heading text-[36px] font-bold leading-[1.15] text-text-main lg:text-[42px]">
              Почему МедКонтроль выбирают
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {advantages.map((item) => (
                <article
                  key={item.title}
                  className="min-h-[190px] rounded-card bg-card p-8 shadow-card"
                >
                  <div className="flex h-full items-start gap-6">

                    <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-lilac-light">
                      <img
                        src={item.image}
                        alt=""
                        className="h-[30px] w-[30px] object-contain"
                      />
                    </div>

                    <div>
                      <h3 className="font-heading text-[19px] font-bold leading-[1.25] text-text-main">
                        {item.title}
                      </h3>

                      <p className="mt-4 text-[14px] leading-[1.45] text-text-secondary">
                        {item.text}
                      </p>
                    </div>

                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================
            ФИНАЛЬНЫЙ CTA
        ========================== */}
        <section className="w-full bg-background">
          <div className="mx-auto w-full max-w-[1400px] px-6 pb-10 sm:px-8 lg:px-10 xl:px-0">

            <div className="relative min-h-[250px] overflow-hidden rounded-card bg-background-soft">

              <img
                src="/images/home/main-banner-3.svg"
                alt=""
                className="absolute bottom-0 right-0 h-[80%] w-full object-contain object-right-bottom"
              />

              <div className="relative z-10 max-w-[560px] px-8 py-10 lg:px-10">
                <p className="text-[13px] font-medium text-olive-accent">
                  МедКонтроль
                </p>

                <h2 className="mt-1 font-heading text-[32px] font-bold leading-[1.15] text-text-main lg:text-[38px]">
                  Здоровье для всех
                </h2>

                <p className="mt-3 max-w-[500px] text-[15px] leading-[1.45] text-text-secondary">
                  Присоединяйтесь к тысячам пользователей, которые уже
                  заботятся о себе и своих близких с помощью МедКонтроль.
                </p>

                <Link
                  to="/register"
                  className="mt-6 flex h-[46px] w-fit items-center gap-4 rounded-pill bg-olive-accent px-6 text-[14px] text-white"
                >
                  <span>Зарегистрироваться</span>

                  <img
                    src="/images/arrow.svg"
                    alt=""
                    className="h-[22px] w-[22px] object-contain"
                  />
                </Link>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}