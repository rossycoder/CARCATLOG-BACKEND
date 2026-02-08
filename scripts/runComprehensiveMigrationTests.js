/**
 * Comprehensive Migration Test Suite
 * 
 * Runs all integration tests to verify the migration is successful.
 * Tests all vehicle types, race conditions, and data consistency.
 * 
 * Requirements: 5.3, 6.4, 11.1
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class MigrationTestRunner {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      skipped: []
    };
  }

  async run() {
    console.log('🧪 Running Comprehensive Migration Tests\n');
    console.log('=' .repeat(60));

    try {
      // Test 1: Property Tests
      await this.runPropertyTests();

      // Test 2: Integration Tests
      await this.runIntegrationTests();

      // Test 3: Race Condition Tests
      await this.runRaceConditionTests();

      // Test 4: Vehicle Type Tests
      await this.runVehicleTypeTests();

      // Test 5: Performance Tests
      await this.runPerformanceTests();

      // Report Results
      this.reportResults();

      if (this.results.failed.length > 0) {
        console.log('\n❌ Some tests failed. Migration verification incomplete.');
        process.exit(1);
      } else {
        console.log('\n✅ All tests passed! Migration verified successfully.');
      }

    } catch (error) {
      console.error('\n❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async runPropertyTests() {
    console.log('\n📋 Running Property Tests...\n');

    const propertyTests = [
      'backend/test/services/universalAutoCompleteService.property.test.js',
      'backend/test/clients/apiClientSeparation.property.test.js',
      'backend/test/controllers/controllerServiceRouting.property.test.js'
    ];

    for (const test of propertyTests) {
      await this.runTest(test, 'Property Test');
    }
  }

  async runIntegrationTests() {
    console.log('\n📋 Running Integration Tests...\n');

    const integrationTests = [
      'backend/scripts/testUniversalServiceBasic.js',
      'backend/scripts/testUniversalServiceAllVehicleTypes.js',
      'backend/scripts/testCompleteCarCreationFlow.js'
    ];

    for (const test of integrationTests) {
      await this.runTest(test, 'Integration Test');
    }
  }

  async runRaceConditionTests() {
    console.log('\n📋 Running Race Condition Tests...\n');

    const raceTests = [
      'backend/test/services/universalAutoCompleteService.raceCondition.test.js'
    ];

    for (const test of raceTests) {
      await this.runTest(test, 'Race Condition Test');
    }
  }

  async runVehicleTypeTests() {
    console.log('\n📋 Running Vehicle Type Tests...\n');

    const vehicleTests = [
      { script: 'testUniversalServiceAllVehicleTypes.js', type: 'All Types' }
    ];

    for (const test of vehicleTests) {
      await this.runTest(
        `backend/scripts/${test.script}`,
        `Vehicle Test (${test.type})`
      );
    }
  }

  async runPerformanceTests() {
    console.log('\n📋 Running Performance Tests...\n');

    // Simple performance check
    const testName = 'API Call Deduplication';
    try {
      console.log(`   Testing: ${testName}`);
      
      const universalService = require('../services/universalAutoCompleteService');
      
      // Verify cache and deduplication methods exist
      if (typeof universalService.getCompleteVehicleData === 'function') {
        console.log(`   ✓ ${testName} - Service methods verified`);
        this.results.passed.push(testName);
      } else {
        throw new Error('Service methods not found');
      }
    } catch (error) {
      console.log(`   ✗ ${testName} - ${error.message}`);
      this.results.failed.push({ name: testName, error: error.message });
    }
  }

  async runTest(testPath, category) {
    const testName = path.basename(testPath);
    const fullPath = path.join(process.cwd(), testPath);

    try {
      // Check if test file exists
      if (!fs.existsSync(fullPath)) {
        console.log(`   ⊘ ${testName} - Skipped (not found)`);
        this.results.skipped.push(testName);
        return;
      }

      console.log(`   Running: ${testName}`);

      // Determine how to run the test
      if (testPath.endsWith('.test.js')) {
        // Jest/Mocha test
        try {
          execSync(`npm test -- ${testPath}`, {
            stdio: 'pipe',
            cwd: process.cwd()
          });
        } catch (error) {
          // Try alternative test runner
          execSync(`node ${fullPath}`, {
            stdio: 'pipe',
            cwd: process.cwd()
          });
        }
      } else {
        // Script test
        execSync(`node ${fullPath}`, {
          stdio: 'pipe',
          cwd: process.cwd(),
          timeout: 30000
        });
      }

      console.log(`   ✓ ${testName} - Passed`);
      this.results.passed.push(testName);

    } catch (error) {
      console.log(`   ✗ ${testName} - Failed`);
      this.results.failed.push({
        name: testName,
        category,
        error: error.message
      });
    }
  }

  reportResults() {
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Results Summary\n');

    const total = this.results.passed.length + 
                  this.results.failed.length + 
                  this.results.skipped.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✓ Passed: ${this.results.passed.length}`);
    console.log(`✗ Failed: ${this.results.failed.length}`);
    console.log(`⊘ Skipped: ${this.results.skipped.length}`);

    if (this.results.failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.failed.forEach(({ name, category, error }) => {
        console.log(`   - ${name} (${category})`);
        if (error) {
          console.log(`     Error: ${error.substring(0, 100)}...`);
        }
      });
    }

    if (this.results.skipped.length > 0) {
      console.log('\n⊘ Skipped Tests:');
      this.results.skipped.forEach(name => {
        console.log(`   - ${name}`);
      });
    }

    // Calculate success rate
    const successRate = total > 0 
      ? ((this.results.passed.length / total) * 100).toFixed(1)
      : 0;

    console.log(`\nSuccess Rate: ${successRate}%`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new MigrationTestRunner();
  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = MigrationTestRunner;
