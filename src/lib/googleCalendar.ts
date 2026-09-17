export async function getFreeSlots(accessToken: string) {
  // Obter a data atual e a data daqui a 7 dias
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: 'primary' }]
    })
  });

  if (!response.ok) {
    console.error('Erro no freeBusy:', await response.text());
    throw new Error('Falha ao buscar agenda no Google');
  }

  const data = await response.json();
  const busySlots = data.calendars.primary.busy || [];

  // Lógica rudimentar para gerar slots disponíveis:
  // Horário comercial: 9h às 17h, ignorando finais de semana.
  // Pulos de 1h em 1h
  const freeSlots = [];
  const now = new Date();
  
  for (let i = 1; i <= 5; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    // Pula fim de semana (0 = Dom, 6 = Sab)
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    
    for (let hour = 9; hour <= 17; hour += 2) { // 9, 11, 13, 15, 17
      const slotStart = new Date(day);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Checa se sobrepõe com algum busySlot
      const isBusy = busySlots.some((busy: any) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return (slotStart >= busyStart && slotStart < busyEnd) || (slotEnd > busyStart && slotEnd <= busyEnd);
      });

      if (!isBusy) {
        freeSlots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          label: `${slotStart.toLocaleDateString('pt-BR')} às ${slotStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        });
        
        // Retorna no máximo 3 opções para não encher o WhatsApp
        if (freeSlots.length >= 3) break;
      }
    }
    if (freeSlots.length >= 3) break;
  }

  return freeSlots;
}

export async function createEvent(accessToken: string, startIso: string, endIso: string, summary: string, description: string) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary,
      description,
      start: { dateTime: startIso },
      end: { dateTime: endIso },
      reminders: { useDefault: true }
    })
  });

  if (!response.ok) {
    console.error('Erro ao criar evento:', await response.text());
    throw new Error('Falha ao agendar no Google Calendar');
  }

  return await response.json();
}
