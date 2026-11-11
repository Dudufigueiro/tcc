<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="auth-page">
        <aside class="auth-brand gt-sm">
          <div>
            <q-icon name="school" size="44px" />
            <h1>Gerenciamento da Carga Horária Docente</h1>
            <p>
              Escolha de aulas com validação automática do limite de carga horária semanal e da
              disponibilidade de vagas.
            </p>
          </div>
          <small>EEB José Marcolino Eckert</small>
        </aside>

        <main class="auth-content">
          <div class="auth-card card-flat">
            <div class="lt-md q-mb-md row items-center no-wrap text-primary">
              <q-icon name="school" size="28px" class="q-mr-sm" />
              <span class="text-subtitle1 text-weight-medium">Carga Horária Docente</span>
            </div>
            <router-view />
          </div>
        </main>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.auth-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-height: 100vh;
}

@media (min-width: 1024px) {
  .auth-page {
    grid-template-columns: 5fr 7fr;
  }
}

.auth-brand {
  background: linear-gradient(160deg, #1f4e79 0%, #15395a 100%);
  color: #fff;
  padding: 56px 48px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.auth-brand h1 {
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 600;
  margin: 18px 0 14px;
}

.auth-brand p {
  font-size: 1.05rem;
  line-height: 1.5;
  opacity: 0.85;
  max-width: 420px;
}

.auth-brand small {
  opacity: 0.7;
}

.auth-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  padding: 32px 30px;
}
</style>
