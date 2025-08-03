export namespace model {
	
	export class Flashcard {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    Category: string;
	    TextContent: string;
	    ImagePath: string;
	    Description: string;
	    SessionFlashcards: SessionFlashcard[];
	
	    static createFrom(source: any = {}) {
	        return new Flashcard(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.Category = source["Category"];
	        this.TextContent = source["TextContent"];
	        this.ImagePath = source["ImagePath"];
	        this.Description = source["Description"];
	        this.SessionFlashcards = this.convertValues(source["SessionFlashcards"], SessionFlashcard);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SessionFlashcard {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    SessionID: number;
	    Session: Session;
	    FlashcardID: number;
	    Flashcard: Flashcard;
	    ResponseTag: string;
	    ResponseNotes: string;
	    // Go type: time
	    Timestamp: any;
	
	    static createFrom(source: any = {}) {
	        return new SessionFlashcard(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.SessionID = source["SessionID"];
	        this.Session = this.convertValues(source["Session"], Session);
	        this.FlashcardID = source["FlashcardID"];
	        this.Flashcard = this.convertValues(source["Flashcard"], Flashcard);
	        this.ResponseTag = source["ResponseTag"];
	        this.ResponseNotes = source["ResponseNotes"];
	        this.Timestamp = this.convertValues(source["Timestamp"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Note {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    SessionID: number;
	    Session: Session;
	    NoteText: string;
	    Category: string;
	    // Go type: time
	    Timestamp: any;
	    IsEncrypted: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Note(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.SessionID = source["SessionID"];
	        this.Session = this.convertValues(source["Session"], Session);
	        this.NoteText = source["NoteText"];
	        this.Category = source["Category"];
	        this.Timestamp = this.convertValues(source["Timestamp"], null);
	        this.IsEncrypted = source["IsEncrypted"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Goal {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    ChildID: number;
	    Child: Child;
	    Name: string;
	    Description: string;
	    TargetValue: number;
	    TargetType: string;
	    // Go type: time
	    StartDate: any;
	    // Go type: time
	    EndDate?: any;
	    IsAchieved: boolean;
	    // Go type: time
	    AchievedDate?: any;
	
	    static createFrom(source: any = {}) {
	        return new Goal(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.ChildID = source["ChildID"];
	        this.Child = this.convertValues(source["Child"], Child);
	        this.Name = source["Name"];
	        this.Description = source["Description"];
	        this.TargetValue = source["TargetValue"];
	        this.TargetType = source["TargetType"];
	        this.StartDate = this.convertValues(source["StartDate"], null);
	        this.EndDate = this.convertValues(source["EndDate"], null);
	        this.IsAchieved = source["IsAchieved"];
	        this.AchievedDate = this.convertValues(source["AchievedDate"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Reward {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    ChildID: number;
	    Child: Child;
	    SessionID?: number;
	    Session: Session;
	    Type: string;
	    Value: number;
	    // Go type: time
	    Timestamp: any;
	    Notes: string;
	
	    static createFrom(source: any = {}) {
	        return new Reward(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.ChildID = source["ChildID"];
	        this.Child = this.convertValues(source["Child"], Child);
	        this.SessionID = source["SessionID"];
	        this.Session = this.convertValues(source["Session"], Session);
	        this.Type = source["Type"];
	        this.Value = source["Value"];
	        this.Timestamp = this.convertValues(source["Timestamp"], null);
	        this.Notes = source["Notes"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Child {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    Name: string;
	    // Go type: time
	    DateOfBirth?: any;
	    Gender: string;
	    ParentGuardianName: string;
	    ContactInfo: string;
	    InitialAssessment: string;
	    Sessions: Session[];
	    Rewards: Reward[];
	    Goals: Goal[];
	
	    static createFrom(source: any = {}) {
	        return new Child(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.Name = source["Name"];
	        this.DateOfBirth = this.convertValues(source["DateOfBirth"], null);
	        this.Gender = source["Gender"];
	        this.ParentGuardianName = source["ParentGuardianName"];
	        this.ContactInfo = source["ContactInfo"];
	        this.InitialAssessment = source["InitialAssessment"];
	        this.Sessions = this.convertValues(source["Sessions"], Session);
	        this.Rewards = this.convertValues(source["Rewards"], Reward);
	        this.Goals = this.convertValues(source["Goals"], Goal);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Session {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    ChildID: number;
	    Child: Child;
	    // Go type: time
	    StartTime: any;
	    // Go type: time
	    EndTime?: any;
	    DurationMinutes: number;
	    SummaryNotes: string;
	    Notes: Note[];
	    SessionActivities: SessionActivity[];
	    SessionFlashcards: SessionFlashcard[];
	    Rewards: Reward[];
	
	    static createFrom(source: any = {}) {
	        return new Session(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.ChildID = source["ChildID"];
	        this.Child = this.convertValues(source["Child"], Child);
	        this.StartTime = this.convertValues(source["StartTime"], null);
	        this.EndTime = this.convertValues(source["EndTime"], null);
	        this.DurationMinutes = source["DurationMinutes"];
	        this.SummaryNotes = source["SummaryNotes"];
	        this.Notes = this.convertValues(source["Notes"], Note);
	        this.SessionActivities = this.convertValues(source["SessionActivities"], SessionActivity);
	        this.SessionFlashcards = this.convertValues(source["SessionFlashcards"], SessionFlashcard);
	        this.Rewards = this.convertValues(source["Rewards"], Reward);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SessionActivity {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    SessionID: number;
	    Session: Session;
	    ActivityID: number;
	    Activity: Activity;
	    // Go type: time
	    StartTime?: any;
	    // Go type: time
	    EndTime?: any;
	    Notes: string;
	
	    static createFrom(source: any = {}) {
	        return new SessionActivity(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.SessionID = source["SessionID"];
	        this.Session = this.convertValues(source["Session"], Session);
	        this.ActivityID = source["ActivityID"];
	        this.Activity = this.convertValues(source["Activity"], Activity);
	        this.StartTime = this.convertValues(source["StartTime"], null);
	        this.EndTime = this.convertValues(source["EndTime"], null);
	        this.Notes = source["Notes"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Activity {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    Name: string;
	    Description: string;
	    DefaultDurationMinutes: number;
	    SessionActivities: SessionActivity[];
	
	    static createFrom(source: any = {}) {
	        return new Activity(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.Name = source["Name"];
	        this.Description = source["Description"];
	        this.DefaultDurationMinutes = source["DefaultDurationMinutes"];
	        this.SessionActivities = this.convertValues(source["SessionActivities"], SessionActivity);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	export class NoteTemplate {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    TemplateText: string;
	    CategoryHint: string;
	    Keywords: string;
	
	    static createFrom(source: any = {}) {
	        return new NoteTemplate(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.TemplateText = source["TemplateText"];
	        this.CategoryHint = source["CategoryHint"];
	        this.Keywords = source["Keywords"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	

}

