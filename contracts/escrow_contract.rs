#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, vec, Env, Symbol, Vec, Address};

const JOB_CREATED: Symbol = symbol_short!("JOB_CREATED");
const FUNDS_RELEASED: Symbol = symbol_short!("FUNDS_RELEASED");

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    
    // Create a new job escrow
    pub fn create_job(env: Env, client: Address, worker: Address, amount: i64) -> u32 {
        client.require_auth();
        
        // Store job details in contract storage
        let job_id = env.storage().instance().get(&b"job_count").unwrap_or(0);
        let new_job_id = job_id + 1;
        
        // Store job details
        let job_key = Symbol::new(&env, format!("job_{}", new_job_id));
        let job_details = vec![
            &env,
            client,
            worker,
            amount.into()
        ];
        
        env.storage().instance().set(&job_key, &job_details);
        env.storage().instance().set(&b"job_count", &new_job_id);
        
        // Emit event
        env.events().publish(
            (JOB_CREATED, client),
            (worker, amount, new_job_id)
        );
        
        new_job_id
    }
    
    // Release funds to worker after job completion
    pub fn release(env: Env, client: Address, worker: Address, job_id: u32) {
        client.require_auth();
        
        // Verify job exists and client is authorized
        let job_key = Symbol::new(&env, format!("job_{}", job_id));
        let job_details: Vec<Address> = env.storage().instance().get(&job_key).unwrap();
        
        assert!(
            job_details.get(0).unwrap() == client,
            "Only client can release funds"
        );
        assert!(
            job_details.get(1).unwrap() == worker,
            "Worker address mismatch"
        );
        
        // In a real contract, you would transfer funds here
        // For now, we just emit an event
        
        // Emit release event
        env.events().publish(
            (FUNDS_RELEASED, client),
            (worker, job_id)
        );
        
        // Clean up storage
        env.storage().instance().remove(&job_key);
    }
    
    // Get job count
    pub fn get_job_count(env: Env) -> u32 {
        env.storage().instance().get(&b"job_count").unwrap_or(0)
    }
}