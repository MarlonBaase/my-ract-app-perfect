import { supabase } from '../supabase';

/**
 * Ruft die Daten des aktuell eingeloggten Benutzers ab.
 */
export async function getCurrentUser() {
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData?.user) {
    throw new Error('Du musst eingeloggt sein, um diese Aktion auszuführen.');
  }
  return userData.user;
}

/**
 * Erstellt ein neues Support-Ticket inklusive der ersten Nachricht.
 */
export async function createSupportTicket({ titel, kategorie, nachricht }) {
  const user = await getCurrentUser();

  // 1. Ticket in support_tickets anlegen
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .insert([
      {
        benutzer_id: user.id,
        titel,
        kategorie,
        status: 'offen',
        prioritaet: 'mittel',
      },
    ])
    .select()
    .single();

  if (ticketError) throw ticketError;

  // 2. Erste Nachricht in support_nachrichten anlegen
  const { error: msgError } = await supabase
    .from('support_nachrichten')
    .insert([
      {
        ticket_id: ticket.id,
        sender_id: user.id,
        nachricht,
        ist_admin: false,
      },
    ]);

  if (msgError) throw msgError;

  return ticket;
}

/**
 * Lädt alle Tickets des aktuell angemeldeten Benutzers inkl. Chatverlauf.
 */
export async function getUserTickets() {
  await getCurrentUser(); // Stellt sicher, dass ein User eingeloggt ist

  const { data, error } = await supabase
    .from('support_tickets')
    .select('*, support_nachrichten(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fügt eine Antwort des Benutzers zu einem bestehenden Ticket hinzu.
 */
export async function sendUserReply({ ticketId, nachricht }) {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from('support_nachrichten')
    .insert([
      {
        ticket_id: ticketId,
        sender_id: user.id,
        nachricht,
        ist_admin: false,
      },
    ]);

  if (error) throw error;
}