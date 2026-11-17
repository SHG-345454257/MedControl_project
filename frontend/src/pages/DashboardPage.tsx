import AppHeader from "../components/layout/AppHeader";
import Footer from "../components/layout/Footer";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background-soft">
      <AppHeader />

      <main>
        {/* Основная область дашборда */}
        <section className="relative px-6 pb-8 pt-8">

          {/* Группа заголовка + карточки */}
          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-240px)] max-w-[740px] flex-col">

            {/* Листья — задний слой */}
            <img
              src="/images/dashboard/leaves-dashboard.svg"
              alt=""
              className="pointer-events-none absolute right-[+10px] top-[-25px] z-0 h-[120px] w-auto object-contain"
            />

            {/* Заголовок */}
            <div className="relative z-10 mb-5">

              <h1 className="font-heading text-[32px] font-bold leading-none text-text-main">
                Мой день
              </h1>

              <div className="mt-3 flex items-center gap-2 text-[14px] text-text-secondary">
                <img
                  src="/images/dashboard/calendar.svg"
                  alt=""
                  className="h-[22px] w-[22px] object-contain"
                />

                <span>23 сентября</span>
              </div>
            </div>

            {/* Основная карточка */}
            <div className="relative z-10 flex flex-1 flex-col rounded-card bg-card px-5 py-6 shadow-card">

              {/* Утро */}
              <div className="flex items-center">
                <div className="flex h-[29px] items-center gap-2 rounded-pill bg-green-bg px-3">
                  <img
                    src="/images/dashboard/morning.svg"
                    alt=""
                    className="h-[18px] w-[18px] object-contain"
                  />

                  <span className="text-[12px] text-text-main">
                    Утро
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <MedicineRow
                  time="08:00"
                  name="Лозартан"
                  dosage="1 таблетка"
                  icon="/images/medicines/pill.svg"
                />

                <MedicineRow
                  time="10:00"
                  name="Витамин D3"
                  dosage="10 капель"
                  icon="/images/medicines/drop.svg"
                />
              </div>

              {/* День */}
              <div className="mt-3 flex items-center">
                <div className="flex h-[29px] items-center gap-2 rounded-pill bg-green-bg px-3">
                  <img
                    src="/images/dashboard/day.svg"
                    alt=""
                    className="h-[18px] w-[18px] object-contain"
                  />

                  <span className="text-[12px] text-text-main">
                    День
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <MedicineRow
                  time="14:00"
                  name="Гастрарекс"
                  dosage="1 капсула"
                  icon="/images/medicines/capsule.svg"
                />
              </div>

              {/* Вечер */}
              <div className="mt-3 flex items-center">
                <div className="flex h-[29px] items-center gap-2 rounded-pill bg-green-bg px-3">
                  <img
                    src="/images/dashboard/evening.svg"
                    alt=""
                    className="h-[18px] w-[18px] object-contain"
                  />

                  <span className="text-[12px] text-text-main">
                    Вечер
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <MedicineRow
                  time="21:00"
                  name="Мелаксен"
                  dosage="1 таблетка"
                  icon="/images/medicines/pill.svg"
                />

                <MedicineRow
                  time="22:00"
                  name="Азarga"
                  dosage="2 капли"
                  icon="/images/medicines/drop.svg"
                />
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


/* Строка одного лекарства */
function MedicineRow({
  time,
  name,
  dosage,
  icon,
}: {
  time: string;
  name: string;
  dosage: string;
  icon: string;
}) {
  return (
    <div className="flex h-[55px] items-center rounded-[16px] border border-[#C8D1B5] bg-background px-3">

      {/* Время */}
      <div className="flex h-[34px] w-[73px] shrink-0 items-center justify-center rounded-input bg-green-bg text-[12px] text-text-main">
        {time}
      </div>

      {/* Разделитель */}
      <div className="mx-4 h-[27px] w-px bg-[#C8D1B5]" />

      {/* Иконка лекарства */}
      <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-lilac-light">
        <img
          src={icon}
          alt=""
          className="h-[22px] w-[22px] object-contain"
        />
      </div>

      {/* Название */}
      <div className="ml-4 min-w-0">
        <p className="text-[14px] leading-[17px] text-text-secondary">
          {name}
        </p>

        <p className="mt-[2px] text-[11px] leading-[14px] text-text-secondary">
          {dosage}
        </p>
      </div>

      {/* Выполнено */}
      <div className="ml-auto flex h-[30px] w-[30px] shrink-0 items-center justify-center">
        <img
          src="/images/dashboard/completed.svg"
          alt="Выполнено"
          className="h-[30px] w-[30px] object-contain"
        />
      </div>
    </div>
  );
}