// Google Meet integration service
export class GoogleMeetService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  }

  // Initialize Google API
  async initializeGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        window.gapi.load("client:auth2", async () => {
          try {
            await window.gapi.client.init({
              apiKey: this.apiKey,
              clientId: this.clientId,
              discoveryDocs: [
                "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
              ],
              scope: "https://www.googleapis.com/auth/calendar.events",
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      } else {
        reject(new Error("Google API not loaded"));
      }
    });
  }

  // Create a Google Meet session
  async createMeetSession(sessionData) {
    try {
      await this.initializeGoogleAPI();

      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }

      const event = {
        summary: `Skill Swap Session: ${sessionData.skillOffered}`,
        description: `Skill swap session between users for ${sessionData.skillOffered}`,
        start: {
          dateTime: sessionData.startTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: sessionData.endTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        conferenceData: {
          createRequest: {
            requestId: `skill-swap-${Date.now()}`,
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
        attendees: sessionData.attendees || [],
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: "primary",
        resource: event,
        conferenceDataVersion: 1,
      });

      const meetLink = response.result.conferenceData?.entryPoints?.[0]?.uri;

      return {
        success: true,
        meetLink,
        eventId: response.result.id,
        event: response.result,
      };
    } catch (error) {
      console.error("Error creating Google Meet session:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate a simple meet link (fallback)
  generateMeetLink() {
    const meetId = Math.random().toString(36).substring(2, 15);
    return `https://meet.google.com/${meetId}`;
  }

  // Open Google Meet in new tab
  openMeetSession(meetLink) {
    if (meetLink) {
      window.open(meetLink, "_blank", "noopener,noreferrer");
      return true;
    }
    return false;
  }

  // Join an existing session
  joinSession(sessionId) {
    const meetLink = `https://meet.google.com/${sessionId}`;
    return this.openMeetSession(meetLink);
  }
}

export default new GoogleMeetService();
