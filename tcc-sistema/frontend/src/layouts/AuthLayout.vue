<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="auth-page">
        <main class="auth-content">
          <div class="auth-wrapper">
            <header class="auth-header">
              <q-icon name="school" size="40px" />
              <h1>Gerenciamento da Carga Horária Docente</h1>
              <span>EEB José Marcolino Eckert</span>
            </header>

            <div class="auth-card card-flat">
              <router-view />
            </div>
          </div>
        </main>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  background: #fff;
  --q-primary: #2b2e32;
}

.auth-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.auth-wrapper {
  width: 100%;
  max-width: 440px;
}

.auth-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #2b2e32;
  margin-bottom: 24px;
}

.auth-header h1 {
  font-size: 1.5rem;
  line-height: 1.25;
  font-weight: 600;
  margin: 10px 0 4px;
}

.auth-header span {
  font-size: 0.95rem;
  color: #6b7178;
}

.auth-card {
  width: 100%;
  padding: 32px 30px;
}

@media (max-width: 599px) {
  .auth-header h1 {
    font-size: 1.3rem;
  }

  .auth-card {
    padding: 24px 20px;
  }
}
</style>
