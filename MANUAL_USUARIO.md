# Guia de Uso - Demo Tienda Arriendos (MallPlaza)

## 1. Proposito del documento
Esta guia explica, paso a paso, como usar la web de la demo para completar los flujos principales: login de arrendatario, pago de alquileres, consulta por codigo de comercio y operaciones de back-office.

## 2. Antes de empezar
1. Instala dependencias con `npm i`.
2. Inicia el servidor con `npm run dev`.
3. Abre la URL que entrega Vite (usualmente `http://localhost:5173`).

Nota: la demo consume recursos remotos de la pasarela Pay-me. Necesitas acceso a internet.

## 3. Navegacion general
Al abrir la web veras tres accesos:
- Portal de Arrendatarios.
- Consulta de Cliente.
- Back-office.

El logo de MallPlaza (arriba) siempre devuelve al inicio.

## 4. Portal de Arrendatarios

![Home - Seleccion de portales](docs/capturas/01-home.png)

### 4.1 Ingresar al portal
1. En el inicio, haz clic en `Portal de Arrendatarios`.
2. En la pantalla de login, ingresa cualquier correo y contrasena.
3. Haz clic en `Ingresar`.

### 4.2 Entender el dashboard

![Portal Arrendatarios - Login](docs/capturas/02-login.png)

En la parte superior veras:
- Total pendiente (incluye comision 2%).
- Proximo vencimiento.
- Cantidad de alquileres pagados.

En la tabla veras:
- Local, Periodo, Vencimiento, Monto y Estado.
- El boton `Pagar` aparece solo si hay saldo pendiente.

### 4.3 Pagar un alquiler

![Portal Arrendatarios - Dashboard](docs/capturas/03-dashboard.png)

1. En la tabla, elige un alquiler con estado `Pendiente` o `Vencido`.
2. Haz clic en `Pagar`.
3. Selecciona el monto a pagar:
   - `Total` (monto + comision 2%).
   - `Monto` (solo alquiler).
   - `Comision` (solo comision).
4. Selecciona el metodo:
   - Tarjeta.
   - Yape.
   - Transferencia bancaria.
5. Completa los datos de facturacion y pulsa `Continuar`.
6. Se carga el checkout de Pay-me. Completa el pago.
7. Al finalizar, veras la pantalla de exito con el ID de transaccion (si aplica) y el saldo restante.

### 4.4 Que cambia despues del pago

![Pago - Seleccion de metodo](docs/capturas/04-pago-metodo.png)
![Pago - Datos de facturacion](docs/capturas/05-pago-billing.png)
![Pago - Checkout Pay-me](docs/capturas/06-pago-checkout.png)
![Pago - Exito](docs/capturas/07-pago-exito.png)

- El estado del alquiler se actualiza a `Pagado` o queda `Pendiente` si fue un pago parcial.
- Los estados se recalculan automaticamente segun la fecha de vencimiento (Pendiente/Vencido).
- Se guarda en `localStorage` en la clave compartida `mallplaza_backoffice_payments_v1`.

## 5. Consulta de Cliente
### 5.1 Buscar por codigo de comercio
1. En el inicio, haz clic en `Consulta de Cliente`.
2. Ingresa un codigo de comercio y pulsa `Buscar`.

Codigos de prueba:
- `COM-001`
- `COM-002`
- `COM-003`

![Consulta de cliente - Busqueda](docs/capturas/08-cliente-busqueda.png)

### 5.2 Ver resultados y pagar
1. Se muestra el negocio y el total pendiente.
2. Revisa el historial de alquileres.
3. Si hay saldo, haz clic en `Pagar` y sigue el mismo flujo de pago del Portal de Arrendatarios.

![Consulta de cliente - Resultados](docs/capturas/09-cliente-resultados.png)

### 5.3 Persistencia
Los datos se guardan en `localStorage` y se comparten con Back-office:
- `mallplaza_backoffice_payments_v1` (alquileres y pagos)
- `mallplaza_backoffice_locals_v1` (locales)

## 6. Back-office
### 6.1 Gestion de Locales
1. En el inicio, haz clic en `Back-office`.
2. En la pestaña `Gestion de Locales` puedes:
   - Buscar por codigo, negocio o comercio.
   - Filtrar por estado (Activo/Inactivo).
   - Agregar un local con `Agregar Local`.
   - Eliminar un local (con confirmacion).

Campos al agregar local:
- Codigo del local.
- Codigo de comercio.
- Nombre del negocio.
- Area (m2).
- Alquiler mensual.
- Estado.

Nota: el boton `Editar` esta visible, pero no tiene logica implementada.

![Back-office - Gestion de locales](docs/capturas/10-backoffice-locales.png)

### 6.2 Gestion de Alquileres

1. Cambia a la pestaña `Gestion de Alquileres`.
2. Usa el buscador y filtros por estado, periodo y monto.
3. Para crear cobros, haz clic en `Generar Cobros`.

![Back-office - Gestion de alquileres](docs/capturas/11-backoffice-alquileres.png)

#### Generar Cobros
1. Ingresa Periodo y Fecha de vencimiento.
2. Selecciona uno o varios locales activos.
3. Confirma con `Generar Cobros`.
   - Si ya existe un cobro para el mismo local y periodo, se omite automaticamente.

![Back-office - Generar cobros](docs/capturas/12-backoffice-generar.png)

#### Validar Pago Manual
1. En un alquiler pendiente, haz clic en `Validar Pago`.
2. Completa los campos requeridos:
   - Codigo de comercio (demo)
   - Operation Number
   - Transaction ID
   - Token (Bearer)
   - ALG-API-VERSION
   - Metodo de pago
   - Fecha de pago
   - Referencia
3. Haz clic en `Validar Pago`.
4. El alquiler pasa a `Pagado` y se registra historial.

#### Ver Historial de Pago
1. En un alquiler pagado, haz clic en el icono de historial.
2. Se muestran los registros con los datos de validacion.

### 6.3 Persistencia Back-office
- Locales en `localStorage`: `mallplaza_backoffice_locals_v1`.
- Pagos en `localStorage`: `mallplaza_backoffice_payments_v1`.


## 7. Reiniciar la demo
Para limpiar los datos:
1. Abre DevTools del navegador.
2. Application > Local Storage > elimina las claves `mallplaza_backoffice_*`.
3. Alternativa rapida: ejecuta `localStorage.clear()` en la consola.

## 8. Solucion de problemas
- Si la pasarela no carga, verifica tu conexion a internet.
- Si el pago no avanza, recarga la pagina y repite el flujo.
- Si ves datos antiguos, limpia `localStorage`.

## 9. Limitaciones conocidas
- Login sin autenticacion real.
- Sin backend; toda la data es local.
- Edicion de locales no implementada.
- Pagos dependen de red y sandbox de Pay-me.
