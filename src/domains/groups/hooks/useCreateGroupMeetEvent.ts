/**
 * Create a one-off Google Calendar event with Meet for a group (leader).
 */

import { useCreateGroupMeetEventMutation } from "../queries";

export function useCreateGroupMeetEvent() {
  return useCreateGroupMeetEventMutation();
}
