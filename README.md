
  # Aplicación de Alquileres Mall

  Este proyecto es un ejemplo funcional para demostrar el flujo de cobro de alquileres con múltiples métodos de pago usando la pasarela Pay‑me FLEX. La idea es ofrecer una base clara y práctica para integrar cobros en una experiencia de administración de alquileres, incluyendo selección de método, validación manual, historial y persistencia local para pruebas sin backend.

  El objetivo es que este repositorio sirva como referencia para:
  - Probar y comprender el SDK de Pay‑me FLEX.
  - Simular escenarios reales de cobro con pagos parciales.
  - Registrar y consultar transacciones con la información requerida.
  - Mantener un historial visible de los pagos realizados.

  ## ¿Qué muestra este ejemplo?

  - Cobro por distintos métodos de pago: tarjeta, Yape, PagoEfectivo y transferencia bancaria.
  - Selección del monto a pagar: total, monto o comisión.
  - Validación manual de pagos con los datos necesarios para consulta de transacción.
  - Historial de pagos por operación con la información que se necesita para auditar.
  - Persistencia en `localStorage` para simular el ciclo completo sin backend.
  - Estados de pago que se actualizan según el saldo pendiente.

  ## Flujo general

  1. Se selecciona un alquiler pendiente.
  2. Se elige el monto a pagar (total, monto o comisión).
  3. Se selecciona el método de pago.
  4. Se abre la pasarela Pay‑me FLEX y se procesa el pago.
  5. Se guarda el resultado y se actualiza el estado del alquiler.
  6. Se registra el historial de pago con los datos de consulta.

  ## Pasarela Pay‑me FLEX

  La integración de la pasarela se realiza mediante el SDK de Pay‑me FLEX dentro del modal de pago. Ahí se configura el `payload`, se define el método y se inicializa el formulario con los métodos habilitados.

  El flujo usa:
  - Token y nonce del gateway.
  - Payload con `payment_details`.
  - Métodos disponibles según selección del usuario.

  ## Validación y consulta de pagos

  Para la validación manual se solicita la información mínima que se utiliza en la consulta de transacciones en el endpoint de pruebas:

  - `MERCHANT_CODE`
  - `OPERATION_NUMBER`
  - `TRANSACTION_ID`
  - `TOKEN (Bearer)`
  - `ALG-API-VERSION`

  URL de consulta usada como referencia:
  `https://api.preprod.alignet.io/charges/{{MERCHANT_CODE}}/{{OPERATION_NUMBER}}/{{TRANSACTION_ID}}`

  ## Historial de pagos

  Cada pago validado queda registrado en el historial con los datos clave del pago. Esto permite revisar:
  - Método de pago.
  - Fecha y referencia.
  - Identificadores de transacción.
  - Token y versión de API usada.

  ## Persistencia local

  Para facilitar la prueba sin backend, el proyecto guarda datos en `localStorage`:
  - Locales creados desde el BackOffice.
  - Cobros generados desde el panel administrativo.
  - Historial de pagos por cada operación.

  ## Archivos clave

  - `src/app/components/PaymentGatewayModal.tsx`: lógica de Pay‑me FLEX y selección de método.
  - `src/app/components/ValidatePaymentModal.tsx`: validación manual con datos de consulta.
  - `src/app/components/PaymentHistoryModal.tsx`: historial de pagos.
  - `src/app/components/BackOffice.tsx`: gestión de locales y cobros.
  - `src/app/components/Dashboard.tsx`: vista de alquileres pendientes.

  ## Ejecutar el proyecto

  1. Instala dependencias:
     `npm i`
  2. Inicia el servidor de desarrollo:
     `npm run dev`

  ## Notas

  - Este proyecto es un ejemplo y no reemplaza una integración productiva completa.
  - La persistencia local es solo para pruebas.
  - El objetivo es demostrar el flujo completo de cobro y validación con Pay‑me FLEX.
  
