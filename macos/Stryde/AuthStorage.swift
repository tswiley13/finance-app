import Foundation
import Supabase

// Persist the Supabase auth session in UserDefaults instead of the Keychain.
// Ad-hoc signing gives each local build a different code signature, so a
// Keychain-stored session triggers a password prompt on every rebuild. For a
// personal, locally-run app this is a fine trade-off; if we later sign with a
// stable Developer ID we can move back to the Keychain default.
struct UserDefaultsLocalStorage: AuthLocalStorage {
    private let defaults = UserDefaults.standard

    func store(key: String, value: Data) throws {
        defaults.set(value, forKey: key)
    }

    func retrieve(key: String) throws -> Data? {
        defaults.data(forKey: key)
    }

    func remove(key: String) throws {
        defaults.removeObject(forKey: key)
    }
}
