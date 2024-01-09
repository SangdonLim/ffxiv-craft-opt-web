# FFXIV crafting optimizer

This repository contains the source code for a modified version of the FFXIV crafting optimizer app. Improvements and quality-of-life updates were made in this version to streamline using the app. This version is available here: [link](http://sangdonlim.github.io/ffxiv-craft-opt-web)

The original authors of this app are Rhoda Baker and Gordon Tyler, and the original source code is available [here](https://github.com/doxxx/ffxiv-craft-opt-web). Also, this repository is based on a fork by David Hewson [here](https://github.com/dten/ffxiv-craft-opt-web).

## Introduction

Crafting in FFXIV is a sequence optimization problem. In a crafting session, recipe ingredient items are consumed in an attempt to create recipe end product items. A crafting session can end in one of three states:

- Crafting success (normal quality): end product items are obtained in normal-quality variants.
- Crafting success (high quality): end product items are obtained in high-quality variants. These have more in-game value compared to normal-quality variants.
- Crafting failure: end product items are not obtained.

An example is the *elixir* recipe (alchemist level 50), which uses five different ingredients (*distilled water*, *mistletoe*, *nutmeg*, *water elemental shards*, and *lightning elemental shards*). The three possible outcomes are:

- The player obtains a normal-quality *elixir*.
- The player obtains a high-quality *elixir*. This heals more (and maybe tastes better).
- The player does not obtain anything.

## Goals of crafting

As such, a natural goal of crafting in FFXIV is to get the most out from the same ingredients: to obtain high-quality items instead of normal-quality items. In a crafting session, this involves making use of [available crafting actions](https://na.finalfantasyxiv.com/crafting_gathering_guide/alchemist/) to meet a number of goals.

### Increasing progress

First, every recipe has a target progress value, that determines whether the crafting session will end in success or failure. The player's primary goal in a crafting session is to use a sequence of crafting actions to increase progress, and reach the target progress value.

In the *elixir* example, the *elixir* recipe has a target progress value of 180. There are crafting actions that increase progress. Once the progress value reaches 180, the player obtains either a normal-quality or a high-quality *elixir*.

The *elixir* recipe has a durability value of 80. Most crafting actions decrease durability, although there are actions that restore durability. If the durability value reaches 0 and the progress has not reached its target value of 180, the crafting session ends in a failure.

### Increasing quality

Second, every recipe has a target quality value, that determines whether high-quality items will be obtained instead of normal-quality items. The player's secondary goal in a crafting session is to use a sequence of crafting actions to increase quality, and reach the target quality value.

In the *elixir* example, the *elixir* recipe has a target quality value of 2000. There are crafting actions that increase quality. Once the progress reaches its target, the reached quality value is used to determine the probability that a high-quality *elixir* will be obtained instead of a normal-quality *elixir*.

- If the quality has reached its target, the probability is 100%.
- If the quality reached is 0, the probability is 0%.

### Cost of actions

As mentioned, most crafting actions decrease durability, which the player's task is to make sure it does not reach 0 before the progress has reached its target. Most crafting actions also consume the player's CP (crafting points). If the player runs out of CP in a crafting session, the player cannot use crafting actions anymore in the session. The player's another goal in a crafting session is to make use of CP points efficiently.

## Solver

Given the requirements, the crafting optimizer attempts to search for an optimal sequence of crafting actions.
