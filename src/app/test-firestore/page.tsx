import { getAllMembers, getActiveMembers, getWalletPool } from '@/lib/firestore-service';
import { getAllClaims } from '@/lib/claim-actions';

export default async function TestFirestorePage() {
  try {
    const [allMembers, activeMembers, allClaims, walletPool] = await Promise.all([
      getAllMembers(),
      getActiveMembers(),
      getAllClaims(),
      getWalletPool()
    ]);

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Firestore Connection Test</h1>
        
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Connection Successful</h2>
            <p className="text-green-700">Firestore is connected and working properly.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800">Members Collection</h3>
              <p className="text-blue-700">Total Members: {allMembers.length}</p>
              <p className="text-blue-700">Active Members: {activeMembers.length}</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800">Claims Collection</h3>
              <p className="text-purple-700">Total Claims: {allClaims.length}</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800">Wallet Pool</h3>
              <p className="text-orange-700">Current Balance: ${walletPool.currentBalance || 0}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800">Sample Data</h3>
              <p className="text-gray-700">Collections are accessible and queryable.</p>
            </div>
          </div>

          {allMembers.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Sample Member Data:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(allMembers[0], null, 2)}
              </pre>
            </div>
          )}

          {allClaims.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Sample Claim Data:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(allClaims[0], null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Firestore Connection Test</h1>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">❌ Connection Failed</h2>
          <p className="text-red-700 mb-2">There was an error connecting to Firestore:</p>
          <pre className="text-sm bg-red-100 p-2 rounded overflow-auto">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>
      </div>
    );
  }
}

