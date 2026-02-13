export const formatDate = (dateString: string, locale = 'es-CL') => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatCurrency = (
  value: number,
  locale = 'es-CL',
  withDecimals = false
) => {
  const options = withDecimals
    ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : undefined;
  const formatted = value.toLocaleString(locale, options as Intl.NumberFormatOptions | undefined);
  return `S/. ${formatted}`;
};
