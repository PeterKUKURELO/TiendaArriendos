'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, CreditCard, CheckCircle } from 'lucide-react';
import cardImage from '../assets/images/CARD.png';
import yapeImage from '../assets/images/YAPE.png';
import pagoEfectivoImage from '../assets/images/PAGOEFECTIVO.png';
import bank_transfer_image from '../assets/images/BANK_TRANSFER.png';
import { formatCurrency } from '../utils/format';
interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: {
    local: string;
    period: string;
    amount: number;
    paidAmount?: number;
    paidCommission?: number;
  } | null;
  onConfirmPayment: (payload: { paidDeltaAmount: number; paidDeltaCommission: number }) => void;
}

type PaymentMethod = 'CARD' | 'YAPE' | 'PAGOEFECTIVO' | 'BANK_TRANSFER';
type GatewayMethodCode = 'CARD' | 'YAPE' | 'QR' | 'CUOTEALO' | 'PAGOEFECTIVO' | 'BANK_TRANSFER';
type PaymentAmountOption = 'TOTAL' | 'AMOUNT' | 'COMMISSION';


interface BillingState {
  first_name: string;
  last_name: string;
  email: string;
  phone_country_code: string;
  phone_subscriber: string;
  line_1: string;
  line_2: string;
  city: string;
  state: string;
  country: string;
}

declare global {
  interface Window {
    FlexPaymentForms?: new (config: {
      nonce: string;
      payload: Record<string, unknown>;
      settings: {
        show_close_button: boolean;
      };
      display_settings: {
        methods: GatewayMethodCode[];
      };
    }) => {
      init: (
        container: Element,
        responseCallback: (response: unknown) => void,
        trackingCallback: (trackdata: unknown) => void,
        onErrorCallback: (error: unknown) => void
      ) => void;
    };
  }
}

export function PaymentGatewayModal({ isOpen, onClose, rental, onConfirmPayment }: PaymentGatewayModalProps) {
  const FLEX_CSS_URL = 'https://flex.dev.pay-me.cloud/main-flex-payment-forms.css';
  const FLEX_JS_URL = 'https://flex.dev.pay-me.cloud/flex-payment-forms.min.js';
  const FLEX_CSS_ID = 'payme-flex-css';
  const FLEX_JS_ID = 'payme-flex-js';
  const [step, setStep] = useState<'method' | 'details' | 'success'>('method');
  const [detailsView, setDetailsView] = useState<'billing' | 'checkout'>('billing');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [paymentAmountOption, setPaymentAmountOption] = useState<PaymentAmountOption>('TOTAL');
  const [processing, setProcessing] = useState(false);
  const [flexAssetsReady, setFlexAssetsReady] = useState(false);
  const [token, setToken] = useState('');
  const [nonce, setNonce] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [finalTransactionId, setFinalTransactionId] = useState('');
  const [operationNumber, setOperationNumber] = useState('');
  const [payloadReference, setPayloadReference] = useState('');
  const [preparedPayload, setPreparedPayload] = useState<Record<string, unknown> | null>(null);
  const [lastPaidAmount, setLastPaidAmount] = useState(0);
  const [identityDoc] = useState({ country: 'PER', type: 'DNI', identifier: '72661927' });
  const checkoutInitializedRef = useRef('');
  const [billing, setBilling] = useState<BillingState>({
    first_name: 'Peter',
    last_name: 'Kukurelo',
    email: 'peter.kukurelo@pay-me.com',
    phone_country_code: '+51',
    phone_subscriber: '999999999',
    line_1: 'Av. Ejemplo 123',
    line_2: '',
    city: 'Lima',
    state: 'Lima',
    country: 'Peru',
  });
  const DEFAULT_CREDS = {
    clientId: 'Lj6tRqRzDiw56PPdSOOAgogT2HnIjf',
    clientSecret: 'ijuVhdIETgcryjRRAJPGCd9nIu8HetTqDTIYe7VFcScgrprFY4Usu0e3H5KUPKeu',
    merchantCode: '453d8265-e01f-4ea5-9bfe-ca88b88e0beb',
  };
  const amount = rental?.amount ?? 0;
  const commission = amount * 0.02;
  const total = amount + commission;
  const [paidAmount, setPaidAmount] = useState(0);
  const [paidCommission, setPaidCommission] = useState(0);
  const remainingAmount = Math.max(amount - paidAmount, 0);
  const remainingCommission = Math.max(commission - paidCommission, 0);
  const remainingTotal = remainingAmount + remainingCommission;
  const payableAmount =
    paymentAmountOption === 'AMOUNT'
      ? remainingAmount
      : paymentAmountOption === 'COMMISSION'
        ? remainingCommission
        : remainingTotal;
  const formatMoney = (value: number) => formatCurrency(value, 'es-PE', true);

  const ALL_GATEWAY_METHODS: GatewayMethodCode[] = ['CARD', 'YAPE', 'QR', 'CUOTEALO', 'PAGOEFECTIVO', 'BANK_TRANSFER'];
  const methodsForGateway = useMemo<GatewayMethodCode[]>(() => {
    if (paymentMethod === 'YAPE') return ['YAPE'];
    if (paymentMethod === 'PAGOEFECTIVO') return ['PAGOEFECTIVO'];
    if (paymentMethod === 'BANK_TRANSFER') return ['BANK_TRANSFER'];
    return ['CARD'];
  }, [paymentMethod]);

  const buildGatewayPayload = (operation: string, reference: string) => ({
      action: 'authorize',
      channel: 'ecommerce',
      merchant_code: DEFAULT_CREDS.merchantCode,
      merchant_operation_number: operation,
      payment_method: {},
      payment_details: {
        amount: Math.round(payableAmount * 100).toString(),
        currency: '604',
        billing: {
          first_name: billing.first_name,
          last_name: billing.last_name,
          email: billing.email,
          phone: {
            country_code: billing.phone_country_code,
            subscriber: billing.phone_subscriber,
          },
          location: {
            line_1: billing.line_1,
            line_2: billing.line_2,
            city: billing.city,
            state: billing.state,
            country: billing.country,
          },
        }
      },
    });

  const gatewayPayload = useMemo(
    () => buildGatewayPayload(operationNumber, payloadReference),
    [billing, identityDoc, methodsForGateway, operationNumber, payloadReference, payableAmount]
  );

  const generateRandomOperationNumber = () =>
    `${Math.floor(100000 + Math.random() * 900000)}${Date.now().toString().slice(-6)}`;

  const generateRandomPayloadReference = () =>
    `ref_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const obtenerAccessToken = async () => {
    const r = await fetch('https://auth.preprod.alignet.io/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'authorize',
        grant_type: 'client_credentials',
        audience: 'https://api.dev.alignet.io',
        client_id: DEFAULT_CREDS.clientId,
        client_secret: DEFAULT_CREDS.clientSecret,
        scope: 'create:token post:charges offline_access',
      }),
    });
    const data = await r.json();
    return data.access_token as string;
  };

  const obtenerNonce = async (accessToken: string) => {
    const r = await fetch('https://auth.preprod.alignet.io/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        action: 'create.nonce',
        audience: 'https://api.dev.alignet.io',
        client_id: DEFAULT_CREDS.clientId,
        scope: 'post:charges',
      }),
    });
    const data = await r.json();
    return data.nonce as string;
  };

  const prepareTransaction = async (payload: Record<string, unknown>) => {
    setTokenError('');
    setToken('');
    setNonce('');
    setPreparedPayload(null);

    if (!DEFAULT_CREDS.clientId || !DEFAULT_CREDS.clientSecret) {
      setTokenError('Faltan credenciales (clientId/clientSecret).');
      return null;
    }

    try {
      const accessToken = await obtenerAccessToken();
      const newNonce = await obtenerNonce(accessToken);
      setToken(accessToken);
      setNonce(newNonce);
      setPreparedPayload(payload);
      return { accessToken, newNonce };
    } catch (error) {
      setTokenError('No se pudo obtener token y nonce.');
      return null;
    }
  };

  const extractTransactionId = (response: unknown): string => {
    if (!response || typeof response !== 'object') return '';
    const res = response as Record<string, unknown>;
    const directCandidates = [
      res.transaction_id,
      res.transactionId,
      res.id,
      res.operation_number,
      res.operationNumber,
      res.authorization_code,
      res.authorizationCode,
    ];
    for (const candidate of directCandidates) {
      if (typeof candidate === 'string' && candidate.trim()) return candidate;
      if (typeof candidate === 'number') return String(candidate);
    }

    const nestedCandidates = [res.transaction, res.data, res.response];
    for (const nested of nestedCandidates) {
      if (nested && typeof nested === 'object') {
        const nestedId = extractTransactionId(nested);
        if (nestedId) return nestedId;
      }
    }

    return '';
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    const newOperationNumber = generateRandomOperationNumber();
    const newPayloadReference = generateRandomPayloadReference();
    setPaymentMethod(method);
    setOperationNumber(newOperationNumber);
    setPayloadReference(newPayloadReference);
    setToken('');
    setNonce('');
    setPreparedPayload(null);
    setTokenError('');
    setFinalTransactionId('');
    setLastPaidAmount(0);
    setDetailsView('billing');
    setStep('details');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    if (payableAmount <= 0) {
      setTokenError('No hay saldo pendiente para pagar.');
      setProcessing(false);
      return;
    }

    const payload = buildGatewayPayload(operationNumber, payloadReference);
    const transaction = await prepareTransaction(payload);

    if (!transaction) {
      setProcessing(false);
      return;
    }

    console.log('Gateway payload:', payload);
    console.log('Payment metadata:', {
      paymentMethod,
    });
    checkoutInitializedRef.current = '';
    setDetailsView('checkout');
    setProcessing(false);
  };

  const handleClose = () => {
    setStep('method');
    setDetailsView('billing');
    setPaymentMethod('CARD');
    setPaymentAmountOption('TOTAL');
    setProcessing(false);
    setOperationNumber('');
    setPayloadReference('');
    setToken('');
    setNonce('');
    setPreparedPayload(null);
    setTokenError('');
    setFinalTransactionId('');
    setLastPaidAmount(0);
    checkoutInitializedRef.current = '';
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    const onReady = () => {
      if (!isCancelled) {
        setFlexAssetsReady(true);
      }
    };
    const onError = () => {
      if (!isCancelled) {
        setFlexAssetsReady(false);
        setTokenError('No se pudo cargar el SDK de Flex (JS/CSS).');
      }
    };

    const existingCss = document.getElementById(FLEX_CSS_ID) as HTMLLinkElement | null;
    if (!existingCss) {
      const link = document.createElement('link');
      link.id = FLEX_CSS_ID;
      link.rel = 'stylesheet';
      link.href = FLEX_CSS_URL;
      link.addEventListener('error', onError, { once: true });
      document.head.appendChild(link);
    }

    const ctor =
      window.FlexPaymentForms ??
      (globalThis as { FlexPaymentForms?: Window['FlexPaymentForms'] }).FlexPaymentForms;
    if (ctor) {
      onReady();
      return () => {
        isCancelled = true;
      };
    }

    const existingScript = document.getElementById(FLEX_JS_ID) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement('script');
    if (!existingScript) {
      script.id = FLEX_JS_ID;
      script.src = FLEX_JS_URL;
      script.async = true;
      document.body.appendChild(script);
    }

    script.addEventListener('load', onReady, { once: true });
    script.addEventListener('error', onError, { once: true });

    return () => {
      isCancelled = true;
      script.removeEventListener('load', onReady);
      script.removeEventListener('error', onError);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!rental) return;
    setPaidAmount(rental.paidAmount ?? 0);
    setPaidCommission(rental.paidCommission ?? 0);
    setPaymentAmountOption('TOTAL');
    setLastPaidAmount(0);
  }, [rental?.local, rental?.period, rental?.amount, rental?.paidAmount, rental?.paidCommission]);

  useEffect(() => {
    if (remainingTotal <= 0) return;
    if (paymentAmountOption === 'AMOUNT' && remainingAmount > 0) return;
    if (paymentAmountOption === 'COMMISSION' && remainingCommission > 0) return;
    if (paymentAmountOption === 'TOTAL' && remainingTotal > 0) return;

    if (remainingAmount > 0) {
      setPaymentAmountOption('AMOUNT');
      return;
    }
    if (remainingCommission > 0) {
      setPaymentAmountOption('COMMISSION');
      return;
    }
    setPaymentAmountOption('TOTAL');
  }, [paymentAmountOption, remainingAmount, remainingCommission, remainingTotal]);

  useEffect(() => {
    if (step !== 'details' || detailsView !== 'checkout' || !preparedPayload || !nonce || !flexAssetsReady) return;

    const currentKey = `${operationNumber}:${payloadReference}:${nonce}`;
    if (checkoutInitializedRef.current === currentKey) return;

    const target = document.querySelector('#demo');
    if (!target) {
      setTokenError('No se encontro el contenedor #demo para iniciar la pasarela.');
      return;
    }

    const FlexPaymentFormsCtor =
      window.FlexPaymentForms ??
      (globalThis as { FlexPaymentForms?: Window['FlexPaymentForms'] }).FlexPaymentForms;
    if (!FlexPaymentFormsCtor) {
      setTokenError('No se encontro FlexPaymentForms en window. Verifica el script del gateway.');
      return;
    }

    try {
      const selectedMethods = methodsForGateway.filter((method) => ALL_GATEWAY_METHODS.includes(method));
      const pf = new FlexPaymentFormsCtor({
        nonce,
        payload: preparedPayload,
        settings: {
          show_close_button: false,
        },
        display_settings: {
          methods: selectedMethods,
        },
      });

      target.innerHTML = '';
      pf.init(
        target,
        (response) => {
          console.log('-------Respuesta-------');
          console.log({ response });
          const txId = extractTransactionId(response);
          setFinalTransactionId(txId || 'No disponible');
          const paidThisTime =
            paymentAmountOption === 'TOTAL'
              ? remainingTotal
              : paymentAmountOption === 'AMOUNT'
                ? remainingAmount
                : remainingCommission;
          setLastPaidAmount(paidThisTime);
          const paidDeltaAmount =
            paymentAmountOption === 'TOTAL' || paymentAmountOption === 'AMOUNT' ? remainingAmount : 0;
          const paidDeltaCommission =
            paymentAmountOption === 'TOTAL' || paymentAmountOption === 'COMMISSION' ? remainingCommission : 0;

          if (paymentAmountOption === 'TOTAL') {
            setPaidAmount(amount);
            setPaidCommission(commission);
          } else if (paymentAmountOption === 'AMOUNT') {
            setPaidAmount(amount);
          } else if (paymentAmountOption === 'COMMISSION') {
            setPaidCommission(commission);
          }
          setStep('success');
          onConfirmPayment({ paidDeltaAmount, paidDeltaCommission });
        },
        (trackdata) => {
          console.log('-------Tracking de Eventos-------');
          console.log({ trackdata });
        },
        (error) => {
          console.log('-------Error en el proceso-------');
          console.log({ error });
          setTokenError('Error en el proceso de pago.');
        }
      );
      checkoutInitializedRef.current = currentKey;
      console.log('Payment metadata:', {
        paymentMethod,
        displayMethods: selectedMethods,
      });
    } catch (error) {
      setTokenError('No se pudo inicializar el Checkout gateway.');
    }
  }, [detailsView, flexAssetsReady, methodsForGateway, nonce, onConfirmPayment, operationNumber, payloadReference, preparedPayload, step, paymentMethod]);

  if (!isOpen || !rental) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-2 sm:px-4 py-4">
      <style>{`
        #demo .payment-method-form-wrapper {
          margin-left: 5px !important;
          margin-right: 5px !important;
        }
        #demo {
          width: 100%;
        }
        #demo iframe,
        #demo input,
        #demo select,
        #demo button {
          max-width: 100%;
        }
        .payme-scale {
          width: 100%;
        }
        .payme-scroll {
          max-height: 70vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 640px) {
          .payme-scale {
            transform: scale(0.85);
            transform-origin: top center;
          }
        }
        @media (min-width: 640px) {
          .payme-scroll {
            max-height: none;
            overflow: visible;
          }
        }
      `}</style>
      <div className="absolute inset-0 bg-black/50" onClick={!processing ? handleClose : undefined} />

      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl p-4 sm:p-8 max-h-[95vh] overflow-y-auto">
        {!processing && step !== 'success' && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Pago Exitoso</h2>
            <p className="text-gray-600 mb-6">Tu pago ha sido procesado correctamente</p>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID Transaccion:</span>
                  <span className="font-medium text-gray-900">{finalTransactionId || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Local:</span>
                  <span className="font-medium text-gray-900">{rental.local}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Periodo:</span>
                  <span className="font-medium text-gray-900">{rental.period}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-900 font-bold">Total Pagado:</span>
                  <span className="text-xl font-bold text-[#E91E63]">
                    {formatMoney(lastPaidAmount || payableAmount)}
                  </span>
                </div>
                {remainingTotal > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Saldo pendiente:</span>
                    <span className="font-medium text-gray-900">{formatMoney(remainingTotal)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {step === 'method' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Metodo de Pago</h2>
            <p className="text-gray-600 mb-6">Selecciona como deseas realizar el pago</p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Local:</span>
                  <span className="font-medium text-gray-900">{rental.local}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Periodo:</span>
                  <span className="font-medium text-gray-900">{rental.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto pendiente:</span>
                  <span className="font-medium text-gray-900">{formatMoney(remainingAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Comision pendiente (2%):</span>
                  <span className="font-medium text-gray-900">{formatMoney(remainingCommission)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-300">
                  <span className="text-lg font-bold text-gray-900">Total pendiente:</span>
                  <span className="text-lg font-bold text-[#E91E63]">{formatMoney(remainingTotal)}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Elige el monto a pagar</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {remainingTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentAmountOption('TOTAL')}
                    className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                      paymentAmountOption === 'TOTAL'
                        ? 'border-[#E91E63] bg-pink-50 text-[#E91E63]'
                        : 'border-gray-200 hover:border-[#E91E63] hover:bg-pink-50 text-gray-700'
                    }`}
                  >
                    <p className="text-sm font-semibold">Total</p>
                    <p className="text-xs">{formatMoney(remainingTotal)}</p>
                  </button>
                )}
                {remainingAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentAmountOption('AMOUNT')}
                    className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                      paymentAmountOption === 'AMOUNT'
                        ? 'border-[#E91E63] bg-pink-50 text-[#E91E63]'
                        : 'border-gray-200 hover:border-[#E91E63] hover:bg-pink-50 text-gray-700'
                    }`}
                  >
                    <p className="text-sm font-semibold">Monto</p>
                    <p className="text-xs">{formatMoney(remainingAmount)}</p>
                  </button>
                )}
                {remainingCommission > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentAmountOption('COMMISSION')}
                    className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                      paymentAmountOption === 'COMMISSION'
                        ? 'border-[#E91E63] bg-pink-50 text-[#E91E63]'
                        : 'border-gray-200 hover:border-[#E91E63] hover:bg-pink-50 text-gray-700'
                    }`}
                  >
                    <p className="text-sm font-semibold">Comisión</p>
                    <p className="text-xs">{formatMoney(remainingCommission)}</p>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleMethodSelect('CARD')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#E91E63] hover:bg-pink-50 transition-all text-left flex items-center gap-4 group"
              >
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <img src={cardImage} alt="Tarjeta" className="w-12 h-12 object-contain" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Tarjetas de credito y debito</p>
                  <p className="text-sm text-gray-600">Visa, Mastercard, American Express, Dinners Club</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleMethodSelect('YAPE')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#E91E63] hover:bg-pink-50 transition-all text-left flex items-center gap-4 group"
              >
                <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <img src={yapeImage} alt="Yape" className="w-12 h-12 object-contain" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Yape</p>
                  <p className="text-sm text-gray-600">Pago rapido con numero celular</p>
                </div>
              </button>

              {/* <button
                type="button"
                onClick={() => handleMethodSelect('PAGOEFECTIVO')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#E91E63] hover:bg-pink-50 transition-all text-left flex items-center gap-4 group"
              >
                <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                  <img src={pagoEfectivoImage} alt="PagoEfectivo" className="w-12 h-12 object-contain" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">PagoEfectivo</p>
                  <p className="text-sm text-gray-600">Paga en banca movil, agentes o bodegas</p>
                </div>
              </button> */}
              <button
                type="button"
                onClick={() => handleMethodSelect('BANK_TRANSFER')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#E91E63] hover:bg-pink-50 transition-all text-left flex items-center gap-4 group"
              >
                <div className="p-3 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                  <img src={bank_transfer_image} alt="BankTransfer" className="w-12 h-12 object-contain" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Transferencia Bancaria</p>
                  <p className="text-sm text-gray-600">Realiza tu transferencia bancaria desde banca móvil, agentes o bodegas</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 'details' && !processing && (
          <div>
            <button
              onClick={() => (detailsView === 'checkout' ? setDetailsView('billing') : setStep('method'))}
              className="text-gray-600 hover:text-[#E91E63] mb-4 flex items-center gap-2 transition-colors"
            >
              {detailsView === 'checkout' ? 'Volver a facturacion' : 'Volver'}
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {detailsView === 'checkout' ? 'Pasarela de Pago (Pay-me)' : 'Detalles del Pago'}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Completa tus datos de facturacion y continua para finalizar el pago de forma segura.
            </p>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <p className="text-sm font-bold text-gray-900 mb-3">Datos de transaccion enviados</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Operacion:</span>
                  <span className="font-medium">{operationNumber || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID transaccion final:</span>
                  <span className="font-medium">{finalTransactionId || 'Se genera al aprobar pago'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Metodo:</span>
                  <span className="font-medium">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto a pagar:</span>
                  <span className="font-medium text-[#E91E63]">{formatMoney(payableAmount)}</span>
                </div>
              </div>

              {tokenError && <p className="text-sm text-red-600 mt-3">{tokenError}</p>}
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              {detailsView === 'billing' && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-bold text-gray-900 mb-3">Datos de facturacion (billing)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={billing.first_name}
                      onChange={(e) => setBilling((prev) => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Nombres"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                      required
                    />
                    <input
                      type="text"
                      value={billing.last_name}
                      onChange={(e) => setBilling((prev) => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Apellidos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                      required
                    />
                    <input
                      type="email"
                      value={billing.email}
                      onChange={(e) => setBilling((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Correo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] sm:col-span-2"
                      required
                    />
                    <input
                      type="text"
                      value={billing.phone_country_code}
                      onChange={(e) => setBilling((prev) => ({ ...prev, phone_country_code: e.target.value }))}
                      placeholder="+51"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                      required
                    />
                    <input
                      type="text"
                      value={billing.phone_subscriber}
                      onChange={(e) => setBilling((prev) => ({ ...prev, phone_subscriber: e.target.value }))}
                      placeholder="999999999"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                      required
                    />
                    <input
                      type="text"
                      value={billing.line_1}
                      onChange={(e) => setBilling((prev) => ({ ...prev, line_1: e.target.value }))}
                      placeholder="Direccion linea 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] sm:col-span-2"
                      required
                    />
                    <input
                      type="text"
                      value={billing.line_2}
                      onChange={(e) => setBilling((prev) => ({ ...prev, line_2: e.target.value }))}
                      placeholder="Direccion linea 2 (opcional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] sm:col-span-2"
                    />
                    <input
                      type="text"
                      value={billing.city}
                      onChange={(e) => setBilling((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="Ciudad"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                      required
                    />
                    <input
                      type="text"
                      value={billing.state}
                      onChange={(e) => setBilling((prev) => ({ ...prev, state: e.target.value }))}
                      placeholder="Departamento"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                      required
                    />
                    <input
                      type="text"
                      value={billing.country}
                      onChange={(e) => setBilling((prev) => ({ ...prev, country: e.target.value }))}
                      placeholder="Pais"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E91E63] sm:col-span-2"
                      required
                    />
                  </div>
                </div>
              )}

              {detailsView === 'checkout' && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="payme-scroll min-h-[260px] sm:min-h-[320px] rounded-lg border border-dashed border-gray-300 p-3">
                    <div className="w-full overflow-x-auto">
                      <div className="payme-scale w-full min-w-[280px] sm:w-[420px] sm:mx-auto">
                        <div id="demo" className="w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailsView === 'checkout' && (
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <details>
                    <summary className="text-xs font-semibold text-gray-700 cursor-pointer">
                      Payload de ejemplo (payment_details)
                    </summary>
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">
                        Operation Number: <span className="font-mono">{operationNumber || '-'}</span>
                      </p>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all max-h-40 overflow-auto">
                        {JSON.stringify(preparedPayload ?? gatewayPayload, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 text-center">
                  Transaccion segura mediante pasarela de pago certificada
                </p>
              </div>

              <div className="pt-4">
                {detailsView === 'billing' && (
                  <button
                    type="submit"
                    className="w-full px-6 py-4 bg-[#E91E63] text-white rounded-lg hover:bg-[#C2185B] transition-colors font-bold text-lg"
                  >
                    Continuar
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {processing && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 animate-pulse">
              <CreditCard className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Procesando Pago...</h2>
            <p className="text-gray-600">Por favor espera mientras procesamos tu transaccion</p>
          </div>
        )}
      </div>
    </div>
  );
}
