import 'package:flutter/material.dart';
import '../widgets/glass_scaffold.dart';
import '../widgets/command_card.dart';
import '../../lead_management/screens/lead_dashboard_screen.dart';

class FormsLeadsScreen extends StatelessWidget {
  const FormsLeadsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      title: 'Forms & Leads',
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Lead Generation',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            CommandCard(
              title: 'Open Lead Center',
              subtitle: 'Manage your active leads and forms dashboard',
              icon: Icons.assignment_ind_outlined,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const LeadDashboardScreen()),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
