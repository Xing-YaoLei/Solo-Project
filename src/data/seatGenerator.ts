import type { Seat, TicketType, VenueConfig } from '../types';

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

const TICKET_PRICES: Record<TicketType, number> = {
  VIP: 1999,
  PREMIUM: 999,
  STANDARD: 599,
  ECONOMY: 299,
};

export function generateRowLabels(count: number): string[] {
  return ROW_LABELS.slice(0, count);
}

export function getTicketTypeForRow(
  row: string,
  sections: { name: string; rows: string[]; ticketType: TicketType }[]
): TicketType {
  for (const section of sections) {
    if (section.rows.includes(row)) {
      return section.ticketType;
    }
  }
  return 'STANDARD';
}

export function generateSeats(venueConfig: VenueConfig): Seat[] {
  const seats: Seat[] = [];
  const { rows, seatsPerRow, sections } = venueConfig;
  const rowSpacing = 1.2;
  const seatSpacing = 0.8;
  const stageRise = 0.35;

  const totalWidth = (seatsPerRow - 1) * seatSpacing;
  const totalDepth = (rows.length - 1) * rowSpacing;
  let instanceIndex = 0;

  rows.forEach((row, rowIdx) => {
    const ticketType = getTicketTypeForRow(row, sections);
    const price = TICKET_PRICES[ticketType];
    const z = (rowIdx * rowSpacing) - totalDepth / 2;
    const y = rowIdx * stageRise;

    for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
      const x = ((seatNum - 1) * seatSpacing) - totalWidth / 2;
      seats.push({
        id: `${row}-${seatNum}`,
        row,
        number: seatNum,
        x,
        y,
        z,
        ticketType,
        status: 'AVAILABLE',
        price,
        instanceIndex: instanceIndex++,
      });
    }
  });

  return seats;
}

export function getSeatsByTicketType(seats: Seat[], ticketType: TicketType): Seat[] {
  return seats.filter((s) => s.ticketType === ticketType);
}

export function getAvailableSeats(seats: Seat[]): Seat[] {
  return seats.filter((s) => s.status === 'AVAILABLE');
}

export function getAvailableSeatsByType(seats: Seat[], ticketType: TicketType): Seat[] {
  return seats.filter((s) => s.status === 'AVAILABLE' && s.ticketType === ticketType);
}
