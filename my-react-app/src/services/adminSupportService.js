import { supabase } from '../supabase';
import { getCurrentUser } from './supportService';

/**
 * Lädt alle Tickets für das Admin-Dashboard (optional gefiltert nach Status).
 */
export async function getAdminTickets(statusFilter = 'alle') {
  let query = supabase
    .from('support_tickets')
    .select('*, support_nachrichten(*)')
    .order('erstellt_am', { ascending: false });

  if (statusFilter !== 'alle') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Aktualisiert den Status eines Tickets.
 */
export async function updateTicketStatus(ticketId, newStatus) {
  const { error } = await supabase
    .from('support_tickets')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (error) throw error;
}

/**
 * Sendet eine Nachricht als Admin.
 */
export async function sendAdminReply({ ticketId, nachricht }) {
  const adminUser = await getCurrentUser();

  const { error } = await supabase
    .from('support_nachrichten')
    .insert([
      {
        ticket_id: ticketId,
        sender_id: adminUser.id,
        nachricht,
        ist_admin: true,
      },
    ]);

  if (error) throw error;
}